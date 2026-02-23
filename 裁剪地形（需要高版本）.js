// 配置 Cesium 访问令牌 用于访问 Cesium 服务
Cesium.Ion.defaultAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMDQyMTAzZi1iZDcxLTQ3OWUtYmFjNS1jYzk2MTRkZmIwZjUiLCJpZCI6MjkyMjgwLCJpYXQiOjE3NDQxNzk0NDB9.jtkVaDPrleaNxbbfsdKh8lenB8dFZ01vlECHsDv_lp4`;
// 在创建 Viewer 之前配置
const viewer = new Cesium.Viewer('cesiumContainer', {
    // terrainProvider: new Cesium.CesiumTerrainProvider({
    //     url: 'http://data.marsgis.cn/terrain/',
    //     requestWaterMask: true,
    //     requestVertexNormals: true
    // }),
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
viewer.scene.screenSpaceCameraController.tiltEventTypes = [
    Cesium.CameraEventType.RIGHT_DRAG,
    Cesium.CameraEventType.PINCH,
    {
        eventType: Cesium.CameraEventType.LEFT_DRAG,
        modifier: Cesium.KeyboardEventModifier.CTRL
    }
];
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);

const positions = Cesium.Cartesian3.fromDegreesArray([
  116.38, 39.90,
  116.40, 39.90,
  116.40, 39.92,
  116.38, 39.92
]);

const polygon = new Cesium.ClippingPolygon({
  positions: positions,
});

// 裁剪
const polygons = new Cesium.ClippingPolygonCollection({
  polygons: [polygon],
});

// 裁剪地形
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.clippingPolygons = polygons;

viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.39, 39.91, 1000),
    orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0
    }
});
