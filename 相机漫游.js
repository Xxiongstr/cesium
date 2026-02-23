// 配置 Cesium 访问令牌 用于访问 Cesium 服务
Cesium.Ion.defaultAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMDQyMTAzZi1iZDcxLTQ3OWUtYmFjNS1jYzk2MTRkZmIwZjUiLCJpZCI6MjkyMjgwLCJpYXQiOjE3NDQxNzk0NDB9.jtkVaDPrleaNxbbfsdKh8lenB8dFZ01vlECHsDv_lp4`;
// 在创建 Viewer 之前配置
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: new Cesium.CesiumTerrainProvider({
        url: 'http://data.marsgis.cn/terrain/',
        requestWaterMask: true,
        requestVertexNormals: true
    }),
});

viewer.imageryLayers.addImageryProvider(
    new Cesium.WebMapTileServiceImageryProvider({
        // 'https://t0.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' +
        url: 'http://t0.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' +
            '14ba77517bab8f35dcc7d88916ee09cd',
        layer: 'tdtBasicLayer',
        style: 'default',
        format: 'image/jpeg',
        tileMatrixSetID: 'GoogleMapsCompatible',
        show: true,
        minimumLevel: 0,
        maximumLevel: 18,
    })
);

// 改一下地图按键（右键旋转地图）
viewer.scene.screenSpaceCameraController.zoomEventTypes = [
    Cesium.CameraEventType.WHEEL,
    Cesium.CameraEventType.PINCH
];
viewer.scene.screenSpaceCameraController.tiltEventTypes = [
    Cesium.CameraEventType.RIGHT_DRAG,
    Cesium.CameraEventType.PINCH,
    {
        eventType: Cesium.CameraEventType.LEFT_DRAG,
        modifier: Cesium.KeyboardEventModifier.CTRL
    }
];
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);

/*
 * Cesium 漫游工具
 * 功能：
 *  - 接收多个点位，依次执行：俯视全局 -> 飞到点位 -> 绕点一圈 -> 回到俯视 -> 下一个点位
 *  - 支持播放、暂停、继续、结束控制
 *  - 第二个参数为总漫游时长（秒），会按点位均分（每点：飞行 + 环绕 + 回俯视）
 * 依赖环境：全局 viewer（Cesium.Viewer 实例）
 */

/* eslint-disable */

// 全局漫游控制器
let globalRoamCtl = null;

/**
 * 
 * @param {*} pointList 数组 内部元素元素为 [经度, 纬度, 高度] 或 { lon, lat, height }
 * @param {*} totalSeconds 时间总时长（秒）
 * @param {*} options 配置项
 * @returns 
 */

export function createCesiumRoaming(pointList, totalSeconds = 60, options = {}) {
  if (!Array.isArray(pointList) || pointList.length === 0) {
    throw new Error('pointList 为空');
  }

  const CesiumNS = typeof Cesium !== 'undefined' ? Cesium : window.Cesium;
  if (!CesiumNS || !window.viewer) {
    throw new Error('需要全局 Cesium 与 viewer 实例');
  }

  const viewer = window.viewer;

  // 参数
  const orbitHeight = options.orbitHeight || 300;        // 环绕高度（米）
  const orbitRadius = options.orbitRadius || 200;        // 环绕半径（米）
  const orbitSpeed = options.orbitSpeed || 0.6;          // 环绕角速度（弧度/秒）
  const flySeconds = options.flySeconds || 1.5;          // 飞到点/回俯视 飞行时间（秒）
  const ease = options.easingFunction || CesiumNS.EasingFunction.QUADRATIC_IN_OUT;

  // 将 pointList 统一为 { lon, lat, height? }
  const normalizePoint = (p) => {
    if (Array.isArray(p)) {
      const [lon, lat, height = 0] = p;
      return { lon, lat, height };
    }
    if (p && typeof p === 'object') {
      const { lon, lat, lng, height = 0 } = p;
      return { lon: lon ?? lng, lat, height };
    }
    throw new Error('非法点位：' + JSON.stringify(p));
  };

  const points = pointList.map(normalizePoint);

  // 计算俯视矩形
  function computeRectangle(points) {
    let west = 180, south = 90, east = -180, north = -90;
    points.forEach(({ lon, lat }) => {
      west = Math.min(west, lon);
      south = Math.min(south, lat);
      east = Math.max(east, lon);
      north = Math.max(north, lat);
    });
    // 扩展边界，使得相机更松弛
    const padLon = Math.max(0.001, (east - west) * 0.15);
    const padLat = Math.max(0.001, (north - south) * 0.15);
    return CesiumNS.Rectangle.fromDegrees(west - padLon, south - padLat, east + padLon, north + padLat);
  }

  const rectangleAll = computeRectangle(points);

  // 每个点的时间分配：总时长 / 点数；再按权重拆分为：飞到点、环绕、回俯视
  const perPoint = Math.max(3, totalSeconds / points.length);
  const perFly = Math.min(flySeconds, Math.max(0.8, perPoint * 0.25));
  const perOrbit = Math.max(1.2, perPoint - perFly * 2);

  let isRunning = false;
  let isPaused = false;
  let currentIndex = -1;
  let orbitRemoveFunc = null; // 取消环绕 tick

  function lookAll(duration = 1.2) {
    return new Promise((resolve) => {
      // 确保解除任何 lookAt 绑定
      try { viewer.camera.lookAtTransform(CesiumNS.Matrix4.IDENTITY); } catch (e) {}
      viewer.camera.flyTo({
        destination: rectangleAll,
        duration,
        easingFunction: ease,
        complete: resolve
      });
    });
  }

  function flyToPoint(point, duration = perFly) {
    const { lon, lat, height = 0 } = point;
    const target = CesiumNS.Cartesian3.fromDegrees(lon, lat, height);
    const offset = new CesiumNS.HeadingPitchRange(
      0,
      CesiumNS.Math.toRadians(-25),
      Math.max(orbitRadius, 50)
    );
    return new Promise((resolve) => {
      // 先解除 lookAt，再飞向目标并以固定距离观察
      try { viewer.camera.lookAtTransform(CesiumNS.Matrix4.IDENTITY); } catch (e) {}
      viewer.camera.flyToBoundingSphere(new CesiumNS.BoundingSphere(target, 1), {
        duration,
        offset,
        easingFunction: ease,
        complete: resolve
      });
    });
  }

  function orbitPoint(point, seconds = perOrbit) {
    const { lon, lat, height = 0 } = point;
    const target = CesiumNS.Cartesian3.fromDegrees(lon, lat, height);

    let elapsed = 0;
    let lastTime = null;

    return new Promise((resolve) => {
      const tick = (clock) => {
        const now = clock.currentTime;
        if (lastTime == null) {
          lastTime = now;
          // 第一次进入即绑定 lookAt，以目标为中心旋转
          try {
            viewer.camera.lookAt(
              target,
              new CesiumNS.HeadingPitchRange(0, CesiumNS.Math.toRadians(-25), Math.max(orbitRadius, 50))
            );
          } catch (e) {}
        }

        const dt = CesiumNS.JulianDate.secondsDifference(now, lastTime);
        lastTime = now;

        if (!isPaused) {
          elapsed += Math.max(0, dt);
          const heading = elapsed * orbitSpeed; // 弧度
          try {
            viewer.camera.lookAt(
              target,
              new CesiumNS.HeadingPitchRange(heading, CesiumNS.Math.toRadians(-25), Math.max(orbitRadius, 50))
            );
          } catch (e) {}
        }

        if (elapsed >= seconds) {
          stopTick();
          resolve();
        }
      };

      function stopTick() {
        viewer.clock.onTick.removeEventListener(tick);
        // 解除绑定，避免后续 flyTo 受影响
        try { viewer.camera.lookAtTransform(CesiumNS.Matrix4.IDENTITY); } catch (e) {}
      }

      viewer.clock.onTick.addEventListener(tick);
      orbitRemoveFunc = () => {
        viewer.clock.onTick.removeEventListener(tick);
        try { viewer.camera.lookAtTransform(CesiumNS.Matrix4.IDENTITY); } catch (e) {}
      };
    });
  }

  async function run() {
    isRunning = true;
    await lookAll(1.2);

    for (let i = 0; i < points.length && isRunning; i++) {
      currentIndex = i;
      const p = points[i];

      await flyToPoint(p);
      if (!isRunning) break;

      await orbitPoint(p);
      if (!isRunning) break;

      await lookAll(perFly);
    }

    // 结束后回到俯视
    if (isRunning) await lookAll(1.0);
    isRunning = false;
  }

  function play() {
    if (isRunning) return;
    isPaused = false;
    run();
  }

  function pause() {
    isPaused = true;
  }

  function resume() {
    isPaused = false;
  }

  function stop() {
    isRunning = false;
    isPaused = false;
    if (orbitRemoveFunc) {
      try { orbitRemoveFunc(); } catch (e) {}
      orbitRemoveFunc = null;
      lookAll(0.8);
    }
    try { viewer.camera.lookAtTransform(CesiumNS.Matrix4.IDENTITY); } catch (e) {}
  }

  // 初始化先看全局
  lookAll(0.8);

  // 保存到全局控制器
  globalRoamCtl = {
    play, pause, resume, stop,
    isRunning: () => isRunning,
    isPaused: () => isPaused,
    getCurrentIndex: () => currentIndex
  };

  return globalRoamCtl;
}

// 直接导出的控制方法
export function startRoaming() {
  if (globalRoamCtl) {
    globalRoamCtl.play();
  }
}

export function pauseRoaming() {
  if (globalRoamCtl) {
    globalRoamCtl.pause();
  }
}

export function resumeRoaming() {
  if (globalRoamCtl) {
    globalRoamCtl.resume();
  }
}

export function stopRoaming() {
  if (globalRoamCtl) {
    globalRoamCtl.stop();
  }
}

export default { createCesiumRoaming, startRoaming, pauseRoaming, resumeRoaming, stopRoaming };


