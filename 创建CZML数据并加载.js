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
viewer.scene.screenSpaceCameraController.tiltEventTypes = [
    Cesium.CameraEventType.RIGHT_DRAG,
    Cesium.CameraEventType.PINCH,
    {
        eventType: Cesium.CameraEventType.LEFT_DRAG,
        modifier: Cesium.KeyboardEventModifier.CTRL
    }
];
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);

const czml = [//pocket
    //必须的节点，document
    {
        id: "document",
        name: "CZML Path",
        version: "1.0",
        clock: {
            interval: "2012-08-04T10:00:00Z/2012-08-04T15:00:00Z",
            currentTime: "2012-08-04T10:00:00Z",
            multiplier: 100,
        },
    },
    {
        id: "path",
        name: "path with GPS flight data",
        description:
            "<p>Hang gliding flight log data from Daniel H. Friedman.<br>Icon created by Larisa Skosyrska from the Noun Project</p>",
        availability: "2012-08-04T10:00:00Z/2012-08-04T15:00:00Z",
        path: { // 实体
            material: {
                polylineOutline: {
                    color: {
                        rgba: [255, 0, 255, 255],
                    },
                    outlineColor: {
                        rgba: [0, 255, 255, 255],
                    },
                    outlineWidth: 5,
                },
            },
            width: 8,
            leadTime: 5,
            trailTime: 50000,
            resolution: 5,
        },
        orientation: { // 四元素 方向
            "unitQuaternion": [
                0.19134171618254486,
                -0.3314135740355918,
                0.4619397662556433,
                0.8001031451912656,
            ]
        },
        model: { // 模型
            gltf: './model/glb/Cesium_Air.glb'
        },
        position: { // 模型所在的位置 每一个item包括[时间、经度、纬度、高度]
            epoch: "2012-08-04T10:00:00Z",
            cartographicDegrees: [
                0,
                -122,
                39.50935,
                8776,
                3000,
                -122,
                39.60918,
                8773,
                4000,
                -122,
                39.70883,
                8772
            ]
        }
    }
];

// 加载CZML数据
const dataSource = viewer.dataSources.add(Cesium.CzmlDataSource.load(czml)).then(dataSource => {
    viewer.trackedEntity = dataSource.entities.getById("path"); // 获取实体用来相机跟踪
});