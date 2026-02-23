class RadarScanMaterialProperty {
    constructor(options) {
        this._definitionChanged = new window.Cesium.Event();
        this._color = undefined;
        this._speed = undefined;
        this.color = options.color;
        this.speed = options.speed;
    }

    get isConstant() {
        return false;
    }

    get definitionChanged() {
        return this._definitionChanged;
    }

    getType() {
        return window.Cesium.Material.RadarScanMaterialType;
    }

    getValue(time, result) {
        if (!window.Cesium.defined(result)) {
            result = {};
        }

        result.color = window.Cesium.Property.getValueOrDefault(this._color, time, window.Cesium.Color.RED, result.color);
        result.speed = window.Cesium.Property.getValueOrDefault(this._speed, time, 10, result.speed);
        return result
    }

    equals(other) {
        return (this === other ||
            (other instanceof RadarScanMaterialProperty &&
                window.Cesium.Property.equals(this._color, other._color) &&
                window.Cesium.Property.equals(this._speed, other._speed))
        )
    }
}

export default RadarScanMaterialProperty