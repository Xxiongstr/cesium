import RadarScanMaterialProperty from './lib/RadarScanMaterialProperty.js';
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

Object.defineProperties(RadarScanMaterialProperty.prototype, {
    color: Cesium.createPropertyDescriptor('color'),
    speed: Cesium.createPropertyDescriptor('speed')
})

Cesium.RadarScanMaterialProperty = RadarScanMaterialProperty;
Cesium.Material.RadarScanMaterialProperty = 'RadarScanMaterialProperty';
Cesium.Material.RadarScanMaterialType = 'RadarScanMaterialType';
Cesium.Material.RadarScanMaterialSource =
    `
                uniform vec4 color;
                uniform float speed;

                #define PI 3.14159265359

                czm_material czm_getMaterial(czm_materialInput materialInput){
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = materialInput.st;
                vec2 scrPt = st * 2.0 - 1.0;
                float time = czm_frameNumber * speed / 1000.0 ;
                vec3 col = vec3(0.0);
                mat2 rot;
                float theta = -time * 1.0 * PI - 2.2;
                float cosTheta, sinTheta;
                cosTheta = cos(theta);
                sinTheta = sin(theta);
                rot[0][0] = cosTheta;
                rot[0][1] = -sinTheta;
                rot[1][0] = sinTheta;
                rot[1][1] = cosTheta;
                vec2 scrPtRot = rot * scrPt;
                float angle = 1.0 - (atan(scrPtRot.y, scrPtRot.x) / 6.2831 + 0.5);
                float falloff = length(scrPtRot);
                material.alpha = pow(length(col + vec3(.5)),5.0);
                material.diffuse =  (0.5 +  pow(angle, 2.0) * falloff ) *   color.rgb    ;
                return material;
                }

                `

Cesium.Material._materialCache.addMaterial(Cesium.Material.RadarScanMaterialType, {
    fabric: {
        type: Cesium.Material.RadarScanMaterialType,
        uniforms: {
            color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
            speed: 10.0
        },
        source: Cesium.Material.RadarScanMaterialSource
    },
    translucent: function () {
        return true;
    }
})

let rader = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(113.9236839, 22.528061),
    name: '雷达扫描',
    ellipse: {
        semiMajorAxis: 1000.0,
        semiMinorAxis: 1000.0,
        material: new Cesium.RadarScanMaterialProperty({ // 自定义材质
            color: new Cesium.Color(1.0, 1.0, 0.0, 0.2),
            speed: 20.0,
        }),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        outline: true,
        outlineColor: new Cesium.Color(1.0, 1.0, 0.0, 1.0)
    }
})
viewer.flyTo(rader)
