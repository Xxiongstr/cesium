// 配置 Cesium 访问令牌 用于访问 Cesium 服务
Cesium.Ion.defaultAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMDQyMTAzZi1iZDcxLTQ3OWUtYmFjNS1jYzk2MTRkZmIwZjUiLCJpZCI6MjkyMjgwLCJpYXQiOjE3NDQxNzk0NDB9.jtkVaDPrleaNxbbfsdKh8lenB8dFZ01vlECHsDv_lp4`;
// 在创建 Viewer 之前配置
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: new Cesium.CesiumTerrainProvider({
        url: 'http://data.marsgis.cn/terrain/',
        requestWaterMask: true,
        requestVertexNormals: true
    }),
    shouldAnimate: true,//开启动画
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
    })
);

// 改一下地图按键（右键旋转地图）
viewer.scene.screenSpaceCameraController.zoomEventTypes = [
    Cesium.CameraEventType.WHEEL,
    Cesium.CameraEventType.PINCH
];
// 跟踪状态下也允许旋转：左键/右键拖动都当作“旋转”
viewer.scene.screenSpaceCameraController.rotateEventTypes = [
    Cesium.CameraEventType.LEFT_DRAG,
    Cesium.CameraEventType.RIGHT_DRAG
];
viewer.scene.screenSpaceCameraController.tiltEventTypes = [
    Cesium.CameraEventType.PINCH,
    {
        eventType: Cesium.CameraEventType.LEFT_DRAG,
        modifier: Cesium.KeyboardEventModifier.CTRL
    }
];
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
// 避免右键拖动弹出菜单影响旋转
viewer.canvas.oncontextmenu = function () { return false; };

// 三个经纬度点（示例：北京、上海、广州）
const positions = [
    Cesium.Cartesian3.fromDegrees(113.2644, 23.1291, 8000),  // 广州
    Cesium.Cartesian3.fromDegrees(121.4737, 31.2304, 8000), // 上海
    
    Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 8000), // 北京
];

// 创建CatmullRom样条曲线路径
const spline = new Cesium.CatmullRomSpline({
    times: [0, 0.5, 1.0], // 时间点
    points: positions
});

// 笛卡尔转经纬度
function Cartesian3ToLonLat(cartesian) {
    const lonLat = Cesium.Cartographic.fromCartesian(cartesian); // 笛卡尔转弧度
    const longitude = Cesium.Math.toDegrees(lonLat.longitude); // 经度
    const latitude = Cesium.Math.toDegrees(lonLat.latitude);   // 纬度
    const height = lonLat.height;                              // 高度（米）
    return { longitude, latitude, height };
}
// 转成经纬度
console.log(Cartesian3ToLonLat(spline.evaluate(0.5)))

// 计算路径上的多个点
const points = [];
for (let i = 0; i <= 100; i++) {
    const time = i / 100; // 创建0-1之间的时间点
    points.push(spline.evaluate(time)); // 输出0-1之间一百个点的笛卡尔坐标
}

// 创建实体用于显示路径
viewer.entities.add({
    polyline: {
        positions: points,
        width: 3,
        material: Cesium.Color.BLUE
    }
});

// 相机绕路径飞行
const startTime = Cesium.JulianDate.now(); // 当前时间
const stopTime = Cesium.JulianDate.addSeconds(startTime, 30, new Cesium.JulianDate()); // 当前时间加上30秒

console.log(startTime, stopTime);

viewer.clock.startTime = startTime.clone();
viewer.clock.stopTime = stopTime.clone();
viewer.clock.currentTime = startTime.clone();
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // 循环播放
viewer.clock.multiplier = 1; // 时间倍速

// 创建相机飞行路径
const property = new Cesium.SampledPositionProperty(); // 用于记录每一秒对应的位置
for (let i = 0; i <= 100; i++) {
    const time = Cesium.JulianDate.addSeconds(
        startTime, 
        i * .3, // 总时长30秒
        new Cesium.JulianDate()
    );
    const position = spline.evaluate(i / 100);
    property.addSample(time, position);
}

// 设置相机视角（看向路径前方）
// const camera = viewer.camera;
// camera.lookAtTransform(Cesium.Matrix4.IDENTITY); // 重置相机视角
// camera.lookAt( // 相机跟踪
//     property,
//     new Cesium.HeadingPitchRange(Cesium.Math.toRadians(0), Cesium.Math.toRadians(-30), 0)
// );

// 开始漫游
const entity = viewer.entities.add({
    position: property,
    // 有些 glb 的“机头朝向轴”与 Cesium 默认不一致，会看起来像“镜像/反着飞”
    // 这里给一个 180° 航向修正开关：如果你觉得方向正常，把 FIX_HEADING_180 设为 false
    orientation: new Cesium.VelocityOrientationProperty(property),
    model: {
        uri: './model/glb/Cesium_Air.glb', // 可选：显示一个模型
        scale: 1,
        // 大小
        // minimumPixelSize: 128,
        // maximumScale: 2000000000,
    }
});

viewer.trackedEntity = entity;
