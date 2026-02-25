// 配置 Cesium 访问令牌 用于访问 Cesium 服务
Cesium.Ion.defaultAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMDQyMTAzZi1iZDcxLTQ3OWUtYmFjNS1jYzk2MTRkZmIwZjUiLCJpZCI6MjkyMjgwLCJpYXQiOjE3NDQxNzk0NDB9.jtkVaDPrleaNxbbfsdKh8lenB8dFZ01vlECHsDv_lp4`;
// 在创建 Viewer 之前配置
const viewer = new Cesium.Viewer('cesiumContainer', {
  // terrainProvider: new Cesium.CesiumTerrainProvider({
  //     url: 'http://data.marsgis.cn/terrain/',
  //     requestWaterMask: true,
  //     requestVertexNormals: true
  // }),
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

// 在这里写
const coordinates = [
  { latitude: 39.9087, longitude: 116.3975 }, // 北京 
  { latitude: 39.9090, longitude: 116.3980 }, // 北京附近 
  { latitude: 39.9100, longitude: 116.3990 }, // 北京附近 
  { latitude: 31.2304, longitude: 121.4737 }, // 上海 
  { latitude: 31.2350, longitude: 121.4750 }, // 上海附近 
  { latitude: 22.5431, longitude: 114.0579 }  // 深圳
];

function findNearbyPoints(points, distanceThreshold) {
  const clusters = [];
  const processed = new Array(points.length).fill(false);

  // 将经纬度转换为弧度用于距离计算
  function calculateDistance(point1, point2) {
    const lat1 = Cesium.Math.toRadians(point1.latitude);
    const lon1 = Cesium.Math.toRadians(point1.longitude);
    const lat2 = Cesium.Math.toRadians(point2.latitude);
    const lon2 = Cesium.Math.toRadians(point2.longitude);

    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;

    const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // 地球半径（米）
    const R = 6371000;
    return R * c;
  }

  // 计算聚类中心点
  function calculateClusterCenter(clusterPoints) {
    if (clusterPoints.length === 0) return null;

    let sumLat = 0;
    let sumLon = 0;

    clusterPoints.forEach(point => {
      sumLat += point.latitude;
      sumLon += point.longitude;
    });

    return {
      latitude: sumLat / clusterPoints.length,
      longitude: sumLon / clusterPoints.length
    };
  }

  // 聚类算法
  for (let i = 0; i < points.length; i++) {
    if (processed[i]) continue;

    const cluster = [points[i]];
    processed[i] = true;

    for (let j = i + 1; j < points.length; j++) {
      if (processed[j]) continue;

      const distance = calculateDistance(points[i], points[j]);

      if (distance <= distanceThreshold) {
        cluster.push(points[j]);
        processed[j] = true;
      }
    }

    // 只有当聚类中至少有两个点时，才计算中心点
    if (cluster.length >= 2) {
      const center = calculateClusterCenter(cluster);
      clusters.push({
        points: cluster,
        center: center,
        count: cluster.length,
        isCluster: true,
      });
    } else {
      clusters.push({
        points: [cluster[0]],
        center: cluster[0],
        count: 1,
        isCluster: false
      });
    }
  }

  return clusters;
}

function setBuilder() {
  const clusters = findNearbyPoints(coordinates, 1000); // 1000米阈值
  const pinImg = new Cesium.PinBuilder();
  clusters.forEach(cluster => {
    if (cluster.isCluster) {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(cluster.center.longitude, cluster.center.latitude),
        children: cluster.points,
        billboard: {
          image: pinImg.fromText(cluster.count.toString(), Cesium.Color.RED, 40).toDataURL(),
          width: 30,
          height: 30,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -9)
        }
      });
    } else {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(cluster.center.longitude, cluster.center.latitude),
        point: {
          pixelSize: 10,
          color: Cesium.Color.BLUE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        }
      });
    }
  });
}

setBuilder();

viewer.zoomTo(viewer.entities);

// 改变相机触发阈值
viewer.camera.percentageChanged = .5;
viewer.camera.changed.addEventListener(() => {
  // 获取相机位置的椭球面坐标（包含经度、纬度、高度）
  const cartographic = viewer.camera.positionCartographic;
  // 高度以米为单位
  const height = cartographic.height;
  viewer.entities.removeAll();

  if (height < 10000) {
    coordinates.forEach(item => {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(item.longitude, item.latitude),
        point: {
          pixelSize: 10,
          color: Cesium.Color.BLUE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        }
      })
    })
  } else {
    setBuilder();
  }
});

// 窗口坐标
let worldPosition = null;

// 点击事件
viewer.screenSpaceEventHandler.setInputAction((movement) => {
  const position = movement.position;
  const cartesian = viewer.scene.globe.pick(viewer.scene.camera.getPickRay(position), viewer.scene);
  if (cartesian) {
    // 销毁之前的dom
    let div = document.querySelector('.cluster-info');
    if (div) {
      div.remove();
    }
    worldPosition = cartesian;
    // 将笛卡尔坐标转为屏幕坐标
    const result = viewer.scene.cartesianToCanvasCoordinates(cartesian);
    // 获取picker
    const picker = viewer.scene.pick(position);
    if (Cesium.defined(picker)) {
      if (picker.id) {
        if (picker.id.children) {
          const div = createDom();
          div.style.left = (result.x - 150) + 'px';
          div.style.top = (result.y - 300) + 'px';
          let HTML = '';
          picker.id.children.forEach((item, index) => {
            HTML += `<div>${index + 1}</div><div>${item.latitude}, ${item.longitude}</div>`;
          })
          div.innerHTML = HTML;
        }
      }
    }
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

viewer.scene.postRender.addEventListener(postRenderHandler);

function postRenderHandler() {
  if (worldPosition) {
    const result = viewer.scene.cartesianToCanvasCoordinates(worldPosition);
    if (Cesium.defined(result)) {
      screenPosition = result;
      let div = document.querySelector('.cluster-info');
      if (div) {
        div.style.left = (screenPosition.x - 150) + 'px';
        div.style.top = (screenPosition.y - 300) + 'px';
      }
    }
  }
}

function createDom() {
  const div = document.createElement('div');
  div.className = 'cluster-info';
  div.style.position = 'absolute';
  div.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  div.style.left = '0',
    div.style.top = '0',
    div.style.width = '300px';
  div.style.height = '300px';
  document.body.appendChild(div);
  return div;
}