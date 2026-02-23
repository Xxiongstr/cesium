
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

// 创建覆盖整个地球的云层漫游效果
// 使用椭球体几何体 + 云纹理 + 时间动画实现

// 地球半径（米）
const earthRadius = 6378137.0;
// 云层高度（米，在地球表面上方）
const cloudHeight = 10000.0;
// 云层椭球体半径（稍微大于地球）
const cloudRadius = earthRadius + cloudHeight;

// 创建云层椭球体几何体
const cloudEllipsoid = new Cesium.EllipsoidGeometry({
    radii: new Cesium.Cartesian3(cloudRadius, cloudRadius, cloudRadius),
    vertexFormat: Cesium.VertexFormat.POSITION_AND_ST
});

// 创建云层几何体实例
const cloudGeometry = Cesium.EllipsoidGeometry.createGeometry(cloudEllipsoid);

// 创建云层材质，支持UV偏移实现漫游效果
const cloudMaterial = new Cesium.Material({
    fabric: {
        type: 'CloudLayer',
        uniforms: {
            cloudTexture: './image/earth_cloud.png',
            offsetX: 0.0,  // X方向偏移（经度方向）
            offsetY: 0.0,  // Y方向偏移（纬度方向）
            opacity: 0.6   // 云层透明度
        },
        source: `
            uniform sampler2D cloudTexture;
            uniform float offsetX;
            uniform float offsetY;
            uniform float opacity;
            
            czm_material czm_getMaterial(czm_materialInput materialInput) {
                czm_material material = czm_getDefaultMaterial(materialInput);
                
                // 获取UV坐标并应用偏移（实现云层漫游）
                vec2 uv = materialInput.st;
                uv.x += offsetX;
                uv.y += offsetY;
                
                // 确保UV在0-1范围内循环
                uv = fract(uv);
                
                // 采样云纹理
                vec4 cloudColor = texture2D(cloudTexture, uv);
                
                // 应用透明度
                material.diffuse = cloudColor.rgb;
                material.alpha = cloudColor.a * opacity;
                
                return material;
            }
        `
    }
});

// 创建云层图元
const cloudPrimitive = viewer.scene.primitives.add(new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
        geometry: cloudGeometry,
        id: 'cloudLayer'
    }),
    appearance: new Cesium.MaterialAppearance({
        material: cloudMaterial,
        translucent: true,
        aboveGround: true
    }),
    asynchronous: false
}));

// 时间控制变量
let cloudOffsetX = 0.0;  // 经度方向偏移
let cloudOffsetY = 0.0;  // 纬度方向偏移
let lastUpdateTime = Date.now();

// 云层漫游速度（每秒移动的UV单位）
const cloudSpeedX = 0.0001;  // 东西方向速度（正值向东）
const cloudSpeedY = 0.00005; // 南北方向速度（正值向北）

// 监听场景渲染前事件，实现云层随时间漫游
viewer.scene.preRender.addEventListener(function() {
    // 计算时间差（秒）
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastUpdateTime) / 10.0; // 转换为秒
    lastUpdateTime = currentTime;
    
    // 计算UV偏移（随时间累积）
    cloudOffsetX += cloudSpeedX * deltaTime;
    cloudOffsetY += cloudSpeedY * deltaTime;
    
    // 确保偏移值在合理范围内（避免精度问题）
    if (cloudOffsetX > 1.0) cloudOffsetX -= 1.0;
    if (cloudOffsetY > 1.0) cloudOffsetY -= 1.0;
    
    // 更新材质偏移值
    cloudMaterial.uniforms.offsetX = cloudOffsetX;
    cloudMaterial.uniforms.offsetY = cloudOffsetY;
});