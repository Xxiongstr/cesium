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

// 创建自定义数据源
const dataSource = new Cesium.CustomDataSource('myPoints');
// 生成随机点数据（示例：1000个点）
for (let i = 0; i < 1000; i++) {
  // 在中国区域范围内随机生成经纬度
  const longitude = 75 + Math.random() * 60; // 75°E - 135°E
  const latitude = 10 + Math.random() * 45;   // 10°N - 55°N
  
  // 创建点实体
  const entity = dataSource.entities.add({
    position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 0),
    point: {
      pixelSize: 8,
      color: Cesium.Color.BLUE,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 1
    },
    // 可添加属性用于聚合时显示
    properties: {
      value: Math.floor(Math.random() * 100)
    }
  });
}

// 将数据源添加到viewer
viewer.dataSources.add(dataSource);
// 飞过去
viewer.flyTo(dataSource);

dataSource.clustering.enabled = true;
dataSource.clustering.pixelRange = 10; // 聚合像素范围，默认25
dataSource.clustering.minimumClusterSize = 3; // 最小聚合数量，默认2

const pinImg = new Cesium.PinBuilder();
dataSource.clustering.clusterEvent.addEventListener((clustering, cluster) => {
    // clustering 聚合事件
    // cluster 聚合后的点实体
    cluster.label.show = false;
    let pin = pinImg
    .fromText(cluster.label.text, Cesium.Color.RED, 40); // 返回的是一个canvas
    cluster.billboard.image = pin.toDataURL(); // 将canvas转换为base64编码的图片
    cluster.billboard.horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
    cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
    cluster.billboard.show = true;
});