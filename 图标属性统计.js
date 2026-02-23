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

// 创建一个billboard
const billboardEntity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.314521, 22.620389, 100),
    billboard: {
        image: 'https://picsum.photos/30/60?random=1',
        show: true, // 是否显示
        scale: 1, // 缩放比例
        // color: Cesium.Color.WHITE, // 颜色
        // pixelOffset: new Cesium.Cartesian2(0, -32), // 像素偏移
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 垂直对齐方式 有TOP、BOTTOM、CENTER 图片垂直于经纬度的哪个位置
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平对齐方式 有LEFT、CENTER、RIGHT 图片水平于经纬度的哪个位置
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 高度参考 有NONE、CLAMP_TO_GROUND、RELATIVE_TO_GROUND 相对于地形的高度 可贴地属性
        // translucencyByDistance: new Cesium.NearFarScalar(0.0, 1.0, 100000.0, 0.0), // 距离透明度 第一个参数是最近距离、第二个参数是最近距离的透明度、第三个参数是最远距离、第四个参数是最远距离的透明度
        // scaleByDistance: new Cesium.NearFarScalar(0.0, 1.0, 10000.0, 0.0), // 距离缩放 同上 差值计算
        // imageSubRegion: new Cesium.BoundingRectangle(1, 1, 30, 50), // 这个参数的意思是 图片的子区域 第一个参数是左上角的x坐标、第二个参数是左上角的y坐标、第三个参数是从x出发的宽度、第四个参数是从y出发的高度
        // sizeInMeters: false, // 根据镜头的远近 图标会缩放 默认为false
        // disableDepthTestDistance: 100000.0, // 禁用深度测试距离 默认为0.0 即不禁用 单位为米 图标显示在最外层 不会被地形遮挡
        // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 100000.0), // 距离显示条件 第一个参数是最近距离、第二个参数是最远距离 单位为米 图标在最近距离到最远距离之间才会显示
    },
});

viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.314521, 22.620389, 1000),
    orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0
    }
});

const gui = new dat.GUI(); // 差值计算
const getBillboardEntity = billboardEntity.billboard;
const billboard = {
    scale: 1,
    show: true,
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    translucencyByDistance: {
        near: 0.0,
        nearValue: 1.0,
        far: 100000.0,
        farValue: 0.0,
    },
    color: '#000',
    sizeInMeters: false,
}
gui.add(billboard, 'scale', 0.1, 2.0).name('缩放比例').onChange((val) => {
    getBillboardEntity.scale = val;
});
gui.add(billboard, 'show', true).name('是否显示').onChange(val => {
    getBillboardEntity.show = val;
});
gui.add(billboard, 'verticalOrigin', [
    'top',
    'center',
    'bottom'
]).name('垂直对齐方式').onChange(val => {
    console.log(val);
    switch (val) {
        case 'top':
            getBillboardEntity.verticalOrigin = Cesium.VerticalOrigin.TOP;
            break;
        case 'center':
            getBillboardEntity.verticalOrigin = Cesium.VerticalOrigin.CENTER
            break;
        case 'bottom':
            getBillboardEntity.verticalOrigin = Cesium.VerticalOrigin.BOTTOM
            break
    }
});
gui.add(billboard, 'horizontalOrigin', [
    'left',
    'center',
    'right'
]).name('水平对齐方式').onChange(val => {
    switch (val) {
        case 'left':
            getBillboardEntity.horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
            break;
        case 'center':
            getBillboardEntity.horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
            break;
        case 'right':
            getBillboardEntity.horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;
            break
    }
});
gui.addColor(billboard, 'color').name('颜色').onChange(val => {
    getBillboardEntity.color = Cesium.Color.fromCssColorString(val);
});
gui.add(billboard, 'sizeInMeters', false).name('远近缩放').onChange(val => {
    getBillboardEntity.sizeInMeters = val;
});
