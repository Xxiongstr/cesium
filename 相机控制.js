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

// 相机是否按下
const keyWords = {
    ['W'.charCodeAt(0)]: {
        isMove: false,
        callback: null,
        API: 'moveForward',
    }, // 相机向前移动
    ['S'.charCodeAt(0)]: {
        isMove: false,
        callback: null,
        API: 'moveBackward',
    }, // 相机向后移动
    ['A'.charCodeAt(0)]: {
        isMove: false,
        callback: null,
        API: 'moveLeft',
    }, // 相机向左移动
    ['D'.charCodeAt(0)]: {
        isMove: false,
        callback: null,
        API: 'moveRight',
    }, // 相机向右移动
    ['Q'.charCodeAt(0)]: {
        isMove: false,
        callback: null,
        API: 'moveUp',
    }, // 相机向上移动
    ['E'.charCodeAt(0)]: {
        isMove: false,
        callback: null,
        API: 'moveDown',
    }, // 相机向下移动
    [38]: {
        isMove: false,
        callback: null,
        API: 'lookUp',
    }, // 相机向上旋转
    [40]: {
        isMove: false,
        callback: null,
        API: 'lookDown',
    }, // 相机向下旋转
    [37]: {
        isMove: false,
        callback: null,
        API: 'lookLeft',
    }, // 相机向左旋转
    [39]: {
        isMove: false,
        callback: null,
        API: 'lookRight',
    }, // 相机向右旋转
}

let isMove = false;
let key = '';
const ellipsoid = viewer.scene.globe.ellipsoid;
window.addEventListener('keydown', (e) => {
    // 获取相机实例
    if (isMove) return;
    isMove = true;
    key = e.keyCode;
    keyWordsMove();
    onTick();
})

window.addEventListener('keyup', (e) => {
    isMove = false;
    key = e.keyCode;
    keyWords[key].isMove = isMove;
    keyWords[key].callback = null;
    keyWordsMove();
})

function keyWordsMove() {
    if (key in keyWords) {
        keyWords[key].isMove = isMove;
        keyWords[key].callback = (camera, moveRate) => {
            camera[keyWords[key].API](moveRate);
        }
    }
}

function onTick() {
    if (!isMove) {
        key = '';
        cancelAnimationFrame(onTick);
        return;
    }
    const camera = viewer.camera;
    const cameraHeight = ellipsoid.cartesianToCartographic(
        camera.position
    ).height;
    const moveRate = cameraHeight / 100.0;
    if (keyWords[key].isMove) {
        keyWords[key].callback(camera, moveRate);
        requestAnimationFrame(onTick);
    }
}

viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.64, 36.34, 8000),
    orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0
    }
});
