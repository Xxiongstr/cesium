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

// let waterMinElevation = 10, waterMaxElevation = 400, positions = Cesium.Cartesian3.fromDegreesArrayHeights([119.64, 36.34, 8000, 119.66, 36.34, 8000, 119.66, 36.32, 8000, 119.64, 36.32, 8000, 119.64, 36.34, 8000])
let waterMinElevation=180,waterMaxElevation=400,positions=window.Cesium.Cartesian3.fromDegreesArrayHeights([116.64,36.34,0,116.66,36.34,0,116.66,36.32,0,116.64,36.32,0,116.64,36.34,0])
console.log(waterMinElevation, waterMaxElevation, positions)
let entity = viewer.entities.add({
    polygon: {
        hierarchy: positions,
        extrudedHeight: new Cesium.CallbackProperty(() => {
            if (waterMinElevation < waterMaxElevation) {
                waterMinElevation += 0.1
            }
            return waterMinElevation
        }, false),
        material: Cesium.Color.fromCssColorString('#3D81A5').withAlpha(0.7)
    }
})

viewer.entities.add({
    polygon: {
        hierarchy: new Cesium.PolygonHierarchy(positions),
        material: Cesium.Color.WHITE.withAlpha(0.3)
    },
    polyline: {
        positions: positions,
        width: 4,
        clampToGround: true
    }
})

viewer.zoomTo(entity)
