/**
 * 只用於快速建立HTMLElement。知道怎麼用就好，不一定要看懂內部程式。
 * @param  {String}       tag_name   tag名稱，如div、span等。
 * @param  {String|Array} class_list css-class清單
 * @param  {String}       inner_html innerHTML
 * @param  {JsonObject}   attrs      用於setAttribute的key-value物件。
 * @return {HTMLElement}
 */
function simpleCreateHTML(tag_name, class_list, inner_html, attrs){
    const check = t => t !== void 0 && t !== null;

    const node = document.createElement(tag_name);
    if ( check(class_list) ){
        class_list = Array.isArray(class_list) ? class_list : [class_list];
        node.classList.add(...class_list);
    }
    if ( check(inner_html) ){
        node.innerHTML = inner_html;
    }
    if ( check(attrs) ){
        Object.keys(attrs).forEach(k => node.setAttribute(k, attrs[k]));
    }
    return node;
}

/**
 * class是物件導向的基礎，不知道做什麼用的可以去查。
 * constructor()是javascript內，class的「建構子」。
 * 一般來說，class的第一個字會是大寫。
 */

class Car {
    constructor(name){
        this.name = name;
        this.speed = 1;
        this.position = 0;
    }
}

let user = {
    'age': 20,
    'stdheartrate':120
};

class Controller {
    constructor(){
        this.currentDevice = null;

        this.cars = [];

        this.nodes = {
            'cars': null
        };

        this.status = {
            carMoveTimer: null,
            carMovePass: false,
            carMoveInterval: 1000,
            trackLength: 1800,

            max: -200,
            maxindex: 0,
            runningPeakindex:0,
            indexThreshold:200,
            waveThreshold:1,
            sampleRate:500,
            heartrate:0
        };
    }
    /**
     * 這個系統的控制器(Controller)初始化用的函數。「初始化」就是所有主要程式要跑之前，一定要先做的某些事情。
     * @param  {HTMLElement} main_node 要鑲入這個系統的介面節點。
     * @return {undefined}
     */
    init(main_node){
        main_node.classList.add('main--');
        
        const button_scope = simpleCreateHTML('div', 'buttons');
        main_node.appendChild(button_scope);

        const button_chars = ['start', 'connect', 'settings','device'];
        for(let i=0; i<button_chars.length; i++){
        let button = simpleCreateHTML('span', 'button', button_chars[i], {'data-buttonword': button_chars[i]});
        button.addEventListener("click", button_listener); //加入事件監聽，按按鈕執行button_listener
        button_scope.appendChild(button);
        }
        const cars_scope = simpleCreateHTML('div', 'cars');
        main_node.appendChild(cars_scope);
        this.nodes['cars'] = cars_scope;

        const controller = this;
        function button_listener(e){
            let button_word = this.getAttribute('data-buttonword');
            switch(button_word){
                case 'start':
                    controller.startCarTimer();
                    this.parentNode.querySelector('.button[data-buttonword="start"]').innerHTML = 'quit';
                    this.parentNode.querySelector('.button[data-buttonword="start"]').setAttribute('data-buttonword', 'quit');
                    break;

                case 'quit':
                    controller.stopCarTimer();
                    this.parentNode.querySelector('.button[data-buttonword="quit"]').innerHTML = 'start';
                    this.parentNode.querySelector('.button[data-buttonword="quit"]').setAttribute('data-buttonword', 'start');
                    break;
                case 'device':
    
                    getDevice();

                    break;

                case 'connect':

                    this.parentNode.querySelector('.button[data-buttonword="connect"]').innerHTML = 'x';
                    this.parentNode.querySelector('.button[data-buttonword="connect"]').setAttribute('data-buttonword', 'x');
                    controller.currentDevice.gatt.connect()  
                    .then(server => {
                        return server.getPrimaryService('713d0002-503e-4c75-ba94-3148f18d941e');
                    })
                    .then(service => {
                        console.log(service);
                        return service.getCharacteristic('713d0002-503e-4c75-ba94-3148f18d941e');
                    }) 
                    .then(chara => {
                        console.log(chara);
                        let lock = true;
                        chara.startNotifications().then(c => {
                            c.addEventListener('characteristicvaluechanged', function(e){
                                if(lock){
                                    //console.log(this.value.buffer);
                                    //lock = false;
                                    //debugger;
                                    algorithm(Array.from(new Uint8Array(this.value.buffer)));
                                }
                            });
                        })
                    })
                    .catch(error => {console.log(error)});
                    break;

                case 'x':

                    this.parentNode.querySelector('.button[data-buttonword="x"]').innerHTML = 'connect';
                    this.parentNode.querySelector('.button[data-buttonword="x"]').setAttribute('data-buttonword', 'connect');
                    controller.currentDevice.gatt.disconnect();                    
                    break;
                
                case 'settings':

                    user.age = prompt('請輸入年齡', '請填數字');
                    user.stdheartrate = (220 - user.age)*0.6;
                    console.log('年齡已設定為' + user.age + '歲');
                    console.log('標準心率為'+ user.stdheartrate + '(每分鐘)');
                    break;

                default: 

                    alert('oops...');
                    break;
            } 
        }

        function getDevice() {
            // adapted from chrome app polyfill https://github.com/WebBluetoothCG/chrome-app-polyfill

(function () {
  "use strict";

  if (navigator.bluetooth) {
    //already exists, don't polyfill
    console.log('navigator.bluetooth already exists, skipping polyfill')
    return;
  }

  // https://webbluetoothcg.github.io/web-bluetooth/ interface
  function BluetoothDevice(deviceJSON) {
    console.log("got device:", deviceJSON.id)
    this._id = deviceJSON.id;
    this._name = deviceJSON.name;

    this._adData = {};
    if (deviceJSON.adData) {
      this._adData.appearance = deviceJSON.adData.appearance || "";
      this._adData.txPower = deviceJSON.adData.txPower || 0;
      this._adData.rssi = deviceJSON.adData.rssi || 0;
      this._adData.manufacturerData = deviceJSON.adData.manufacturerData || [];
      this._adData.serviceData = deviceJSON.adData.serviceData || [];
    }

    this._deviceClass = deviceJSON.deviceClass || 0;
    this._vendorIdSource = deviceJSON.vendorIdSource || "bluetooth";
    this._vendorId = deviceJSON.vendorId || 0;
    this._productId = deviceJSON.productId || 0;
    this._productVersion = deviceJSON.productVersion || 0;
    this._gatt = new BluetoothRemoteGATTServer(this);
    this._uuids = deviceJSON.uuids;
  };

  BluetoothDevice.prototype = {

    get id() {
      return this._id;
    },
    get name() {
      return this._name;
    },
    get adData() {
      return this._adData;
    },
    get deviceClass() {
      return this._deviceClass;
    },
    get vendorIdSource() {
      return this._vendorIdSource;
    },
    get vendorId() {
      return this._vendorId;
    },
    get productId() {
      return this._productId;
    },
    get productVersion() {
      return this._productVersion;
    },
    get gatt() {
      return this._gatt;
    },
    get uuids() {
      return this._uuids;
    },
    toString: function () {
      return this._id;
    }
  };

  function BluetoothRemoteGATTServer(webBluetoothDevice) {
    this._device = webBluetoothDevice;
    this._connected = false;

    this._callRemote = function (method) {
      var self = this;
      var args = Array.prototype.slice.call(arguments).slice(1, arguments.length)
      return sendMessage("bluetooth:deviceMessage", {method: method, args: args, deviceId: self._device.id})
    }

  };
  BluetoothRemoteGATTServer.prototype = {
    get device() {
      return this._device;
    },
    get connected() {
      return this._connected;
    },
    connect: function () {
      var self = this;
      return self._callRemote("BluetoothRemoteGATTServer.connect")
        .then(function () {
          self._connected = true;
          return self;
        });
    },
    disconnect: function () {
      var self = this;
      return self._callRemote("BluetoothRemoteGATTServer.disconnect")
        .then(function () {
          self._connected = false;
        });
    },
    getPrimaryService: function (UUID) {
      var self = this;
      var canonicalUUID = window.BluetoothUUID.getService(UUID)
      return self._callRemote("BluetoothRemoteGATTServer.getPrimaryService", canonicalUUID)
        .then(function (service) {
          console.log("GOT SERVICE:"+service)
          return new BluetoothGATTService(self._device, canonicalUUID, true);
        })
    },

    getPrimaryServices: function (UUID) {
      var self = this;
      var canonicalUUID = window.BluetoothUUID.getService(UUID)
      return self._callRemote("BluetoothRemoteGATTServer.getPrimaryService", canonicalUUID)
        .then(function (servicesJSON) {
          var servicesData = JSON.parse(servicesJSON);
          var services = [];

          // this is a problem - all services will have the same information (UUID) so no way for this side of the code to differentiate.
          // we need to add an identifier GUID to tell them apart
          servicesData.forEach(function (service) {
            services.push(new BluetoothGATTService(self._device, canonicalUUID, characteristicUuid, true))
          });
          return services;
        });
    },
    toString: function () {
      return "BluetoothRemoteGATTServer";
    }
  };

  function BluetoothGATTService(device, uuid, isPrimary) {
    if (device == null || uuid == null || isPrimary == null) {
      throw Error("Invalid call to BluetoothGATTService constructor")
    }
    this._device = device
    this._uuid = uuid;
    this._isPrimary = isPrimary;

    this._callRemote = function (method) {
      var self = this;
      var args = Array.prototype.slice.call(arguments).slice(1, arguments.length)
      return sendMessage("bluetooth:deviceMessage", {
        method: method,
        args: args,
        deviceId: self._device.id,
        uuid: self._uuid
      })
    }
  }

  BluetoothGATTService.prototype = {
    get device() {
      return this._device;
    },
    get uuid() {
      return this._uuid;
    },
    get isPrimary() {
      return this._isPrimary
    },
    getCharacteristic: function (uuid) {
      var self = this;
      var canonicalUUID = BluetoothUUID.getCharacteristic(uuid)

      return self._callRemote("BluetoothGATTService.getCharacteristic",
        self.uuid, canonicalUUID)
        .then(function (CharacteristicJSON) {
          //todo check we got the correct char UUID back.
          return new BluetoothGATTCharacteristic(self, canonicalUUID, CharacteristicJSON.properties);
        });
    },
    getCharacteristics: function (uuid) {
      var self = this;
      var canonicalUUID = BluetoothUUID.getCharacteristic(uuid)

      return callRemote("BluetoothGATTService.getCharacteristic",
        self.uuid, canonicalUUID)
        .then(function (CharacteristicJSON) {
          //todo check we got the correct char UUID back.
          var characteristic = JSON.parse(CharacteristicJSON);
          return new BluetoothGATTCharacteristic(self, canonicalUUID, CharacteristicJSON.properties);
        });
    },
    getIncludedService: function (uuid) {
      throw new Error('Not implemented');
    },
    getIncludedServices: function (uuids) {
      throw new Error('Not implemented');
    }
  };

  function BluetoothGATTCharacteristic(service, uuid, properties) {
    this._service = service;
    this._uuid = uuid;
    this._properties = properties;
    this._value = null;

    this._callRemote = function (method) {
      var self = this;
      var args = Array.prototype.slice.call(arguments).slice(1, arguments.length)
      return sendMessage("bluetooth:deviceMessage", {
        method: method,
        args: args,
        deviceId: self._service.device.id,
        uuid: self._uuid
      })
    }
  }

  BluetoothGATTCharacteristic.prototype = {
    get service() {
      return this._service;
    },
    get uuid() {
      return this._uuid;
    },
    get properties() {
      return this._properties;
    },
    get value() {
      return this._value;
    },
    getDescriptor: function (descriptor) {
      var self = this;
      throw new Error('Not implemented');
    },
    getDescriptors: function (descriptor) {
      var self = this;
    },
    readValue: function () {
      var self = this;
      return self._callRemote("BluetoothGATTCharacteristic.readValue", self._service.uuid, self._uuid)
        .then(function (valueEncoded) {
          self._value = str2ab(atob(valueEncoded))
          console.log(valueEncoded,":",self._value)
          return new DataView(self._value,0);
        });
    },
    writeValue: function () {
      var self = this;
    },
    startNotifications: function () {
      var self = this;
      return self._callRemote("BluetoothGATTCharacteristic.startNotifications")
    },
    stopNotifications: function () {
      var self = this;
      return self._callRemote("BluetoothGATTCharacteristic.stopNotifications")
    }
  };

  function BluetoothCharacteristicProperties() {

  }

  BluetoothCharacteristicProperties.prototype = {
    get broadcast() {
      return this._broadcast;
    },
    get read() {
      return this._read;
    },
    get writeWithoutResponse() {
      return this._writeWithoutResponse;
    },
    get write() {
      return this._write;
    },
    get notify() {
      return this._notify;
    },
    get indicate() {
      return this._indicate;
    },
    get authenticatedSignedWrites() {
      return this._authenticatedSignedWrites;
    },
    get reliableWrite() {
      return this._reliableWrite;
    },
    get writableAuxiliaries() {
      return this._writableAuxiliaries;
    }
  }

  function BluetoothGATTDescriptor(characteristic, uuid) {
    this._characteristic = characteristic;
    this._uuid = uuid;

    this._callRemote = function (method) {
      var self = this;
      var args = Array.prototype.slice.call(arguments).slice(1, arguments.length)
      return sendMessage("bluetooth:deviceMessage", {
        method: method,
        args: args,
        deviceId: self._characteristic.service.device.id,
        uuid: self._uuid
      })
    }
  }

  BluetoothGATTDescriptor.prototype = {
    get characteristic() {
      return this._characteristic;
    },
    get uuid() {
      return this._uuid;
    },
    get writableAuxiliaries() {
      return this._value;
    },
    readValue: function () {
      return callRemote("BluetoothGATTDescriptor.startNotifications")
    },
    writeValue: function () {
      return callRemote("BluetoothGATTDescriptor.startNotifications")
    }
  };

  function canonicalUUID(uuidAlias) {
    uuidAlias >>>= 0;  // Make sure the number is positive and 32 bits.
    var strAlias = "0000000" + uuidAlias.toString(16);
    strAlias = strAlias.substr(-8);
    return strAlias + "-0000-1000-8000-00805f9b34fb"
  }

  var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  var BluetoothUUID = {};
  BluetoothUUID.canonicalUUID = canonicalUUID;
  BluetoothUUID.service = {
    alert_notification: canonicalUUID(0x1811),
    automation_io: canonicalUUID(0x1815),
    battery_service: canonicalUUID(0x180F),
    blood_pressure: canonicalUUID(0x1810),
    body_composition: canonicalUUID(0x181B),
    bond_management: canonicalUUID(0x181E),
    continuous_glucose_monitoring: canonicalUUID(0x181F),
    current_time: canonicalUUID(0x1805),
    cycling_power: canonicalUUID(0x1818),
    cycling_speed_and_cadence: canonicalUUID(0x1816),
    device_information: canonicalUUID(0x180A),
    environmental_sensing: canonicalUUID(0x181A),
    generic_access: canonicalUUID(0x1800),
    generic_attribute: canonicalUUID(0x1801),
    glucose: canonicalUUID(0x1808),
    health_thermometer: canonicalUUID(0x1809),
    heart_rate: canonicalUUID(0x180D),
    human_interface_device: canonicalUUID(0x1812),
    immediate_alert: canonicalUUID(0x1802),
    indoor_positioning: canonicalUUID(0x1821),
    internet_protocol_support: canonicalUUID(0x1820),
    link_loss: canonicalUUID(0x1803),
    location_and_navigation: canonicalUUID(0x1819),
    next_dst_change: canonicalUUID(0x1807),
    phone_alert_status: canonicalUUID(0x180E),
    pulse_oximeter: canonicalUUID(0x1822),
    reference_time_update: canonicalUUID(0x1806),
    running_speed_and_cadence: canonicalUUID(0x1814),
    scan_parameters: canonicalUUID(0x1813),
    tx_power: canonicalUUID(0x1804),
    user_data: canonicalUUID(0x181C),
    weight_scale: canonicalUUID(0x181D)
  }

  BluetoothUUID.characteristic = {
    "aerobic_heart_rate_lower_limit": canonicalUUID(0x2A7E),
    "aerobic_heart_rate_upper_limit": canonicalUUID(0x2A84),
    "aerobic_threshold": canonicalUUID(0x2A7F),
    "age": canonicalUUID(0x2A80),
    "aggregate": canonicalUUID(0x2A5A),
    "alert_category_id": canonicalUUID(0x2A43),
    "alert_category_id_bit_mask": canonicalUUID(0x2A42),
    "alert_level": canonicalUUID(0x2A06),
    "alert_notification_control_point": canonicalUUID(0x2A44),
    "alert_status": canonicalUUID(0x2A3F),
    "altitude": canonicalUUID(0x2AB3),
    "anaerobic_heart_rate_lower_limit": canonicalUUID(0x2A81),
    "anaerobic_heart_rate_upper_limit": canonicalUUID(0x2A82),
    "anaerobic_threshold": canonicalUUID(0x2A83),
    "analog": canonicalUUID(0x2A58),
    "apparent_wind_direction": canonicalUUID(0x2A73),
    "apparent_wind_speed": canonicalUUID(0x2A72),
    "gap.appearance": canonicalUUID(0x2A01),
    "barometric_pressure_trend": canonicalUUID(0x2AA3),
    "battery_level": canonicalUUID(0x2A19),
    "blood_pressure_feature": canonicalUUID(0x2A49),
    "blood_pressure_measurement": canonicalUUID(0x2A35),
    "body_composition_feature": canonicalUUID(0x2A9B),
    "body_composition_measurement": canonicalUUID(0x2A9C),
    "body_sensor_location": canonicalUUID(0x2A38),
    "bond_management_control_point": canonicalUUID(0x2AA4),
    "bond_management_feature": canonicalUUID(0x2AA5),
    "boot_keyboard_input_report": canonicalUUID(0x2A22),
    "boot_keyboard_output_report": canonicalUUID(0x2A32),
    "boot_mouse_input_report": canonicalUUID(0x2A33),
    "gap.central_address_resolution_support": canonicalUUID(0x2AA6),
    "cgm_feature": canonicalUUID(0x2AA8),
    "cgm_measurement": canonicalUUID(0x2AA7),
    "cgm_session_run_time": canonicalUUID(0x2AAB),
    "cgm_session_start_time": canonicalUUID(0x2AAA),
    "cgm_specific_ops_control_point": canonicalUUID(0x2AAC),
    "cgm_status": canonicalUUID(0x2AA9),
    "csc_feature": canonicalUUID(0x2A5C),
    "csc_measurement": canonicalUUID(0x2A5B),
    "current_time": canonicalUUID(0x2A2B),
    "cycling_power_control_point": canonicalUUID(0x2A66),
    "cycling_power_feature": canonicalUUID(0x2A65),
    "cycling_power_measurement": canonicalUUID(0x2A63),
    "cycling_power_vector": canonicalUUID(0x2A64),
    "database_change_increment": canonicalUUID(0x2A99),
    "date_of_birth": canonicalUUID(0x2A85),
    "date_of_threshold_assessment": canonicalUUID(0x2A86),
    "date_time": canonicalUUID(0x2A08),
    "day_date_time": canonicalUUID(0x2A0A),
    "day_of_week": canonicalUUID(0x2A09),
    "descriptor_value_changed": canonicalUUID(0x2A7D),
    "gap.device_name": canonicalUUID(0x2A00),
    "dew_point": canonicalUUID(0x2A7B),
    "digital": canonicalUUID(0x2A56),
    "dst_offset": canonicalUUID(0x2A0D),
    "elevation": canonicalUUID(0x2A6C),
    "email_address": canonicalUUID(0x2A87),
    "exact_time_256": canonicalUUID(0x2A0C),
    "fat_burn_heart_rate_lower_limit": canonicalUUID(0x2A88),
    "fat_burn_heart_rate_upper_limit": canonicalUUID(0x2A89),
    "firmware_revision_string": canonicalUUID(0x2A26),
    "first_name": canonicalUUID(0x2A8A),
    "five_zone_heart_rate_limits": canonicalUUID(0x2A8B),
    "floor_number": canonicalUUID(0x2AB2),
    "gender": canonicalUUID(0x2A8C),
    "glucose_feature": canonicalUUID(0x2A51),
    "glucose_measurement": canonicalUUID(0x2A18),
    "glucose_measurement_context": canonicalUUID(0x2A34),
    "gust_factor": canonicalUUID(0x2A74),
    "hardware_revision_string": canonicalUUID(0x2A27),
    "heart_rate_control_point": canonicalUUID(0x2A39),
    "heart_rate_max": canonicalUUID(0x2A8D),
    "heart_rate_measurement": canonicalUUID(0x2A37),
    "heat_index": canonicalUUID(0x2A7A),
    "height": canonicalUUID(0x2A8E),
    "hid_control_point": canonicalUUID(0x2A4C),
    "hid_information": canonicalUUID(0x2A4A),
    "hip_circumference": canonicalUUID(0x2A8F),
    "humidity": canonicalUUID(0x2A6F),
    "ieee_11073-20601_regulatory_certification_data_list": canonicalUUID(0x2A2A),
    "indoor_positioning_configuration": canonicalUUID(0x2AAD),
    "intermediate_blood_pressure": canonicalUUID(0x2A36),
    "intermediate_temperature": canonicalUUID(0x2A1E),
    "irradiance": canonicalUUID(0x2A77),
    "language": canonicalUUID(0x2AA2),
    "last_name": canonicalUUID(0x2A90),
    "latitude": canonicalUUID(0x2AAE),
    "ln_control_point": canonicalUUID(0x2A6B),
    "ln_feature": canonicalUUID(0x2A6A),
    "local_east_coordinate.xml": canonicalUUID(0x2AB1),
    "local_north_coordinate": canonicalUUID(0x2AB0),
    "local_time_information": canonicalUUID(0x2A0F),
    "location_and_speed": canonicalUUID(0x2A67),
    "location_name": canonicalUUID(0x2AB5),
    "longitude": canonicalUUID(0x2AAF),
    "magnetic_declination": canonicalUUID(0x2A2C),
    "magnetic_flux_density_2D": canonicalUUID(0x2AA0),
    "magnetic_flux_density_3D": canonicalUUID(0x2AA1),
    "manufacturer_name_string": canonicalUUID(0x2A29),
    "maximum_recommended_heart_rate": canonicalUUID(0x2A91),
    "measurement_interval": canonicalUUID(0x2A21),
    "model_number_string": canonicalUUID(0x2A24),
    "navigation": canonicalUUID(0x2A68),
    "new_alert": canonicalUUID(0x2A46),
    "gap.peripheral_preferred_connection_parameters": canonicalUUID(0x2A04),
    "gap.peripheral_privacy_flag": canonicalUUID(0x2A02),
    "plx_continuous_measurement": canonicalUUID(0x2A5F),
    "plx_features": canonicalUUID(0x2A60),
    "plx_spot_check_measurement": canonicalUUID(0x2A5E),
    "pnp_id": canonicalUUID(0x2A50),
    "pollen_concentration": canonicalUUID(0x2A75),
    "position_quality": canonicalUUID(0x2A69),
    "pressure": canonicalUUID(0x2A6D),
    "protocol_mode": canonicalUUID(0x2A4E),
    "rainfall": canonicalUUID(0x2A78),
    "gap.reconnection_address": canonicalUUID(0x2A03),
    "record_access_control_point": canonicalUUID(0x2A52),
    "reference_time_information": canonicalUUID(0x2A14),
    "report": canonicalUUID(0x2A4D),
    "report_map": canonicalUUID(0x2A4B),
    "resting_heart_rate": canonicalUUID(0x2A92),
    "ringer_control_point": canonicalUUID(0x2A40),
    "ringer_setting": canonicalUUID(0x2A41),
    "rsc_feature": canonicalUUID(0x2A54),
    "rsc_measurement": canonicalUUID(0x2A53),
    "sc_control_point": canonicalUUID(0x2A55),
    "scan_interval_window": canonicalUUID(0x2A4F),
    "scan_refresh": canonicalUUID(0x2A31),
    "sensor_location": canonicalUUID(0x2A5D),
    "serial_number_string": canonicalUUID(0x2A25),
    "gatt.service_changed": canonicalUUID(0x2A05),
    "software_revision_string": canonicalUUID(0x2A28),
    "sport_type_for_aerobic_and_anaerobic_thresholds": canonicalUUID(0x2A93),
    "supported_new_alert_category": canonicalUUID(0x2A47),
    "supported_unread_alert_category": canonicalUUID(0x2A48),
    "system_id": canonicalUUID(0x2A23),
    "temperature": canonicalUUID(0x2A6E),
    "temperature_measurement": canonicalUUID(0x2A1C),
    "temperature_type": canonicalUUID(0x2A1D),
    "three_zone_heart_rate_limits": canonicalUUID(0x2A94),
    "time_accuracy": canonicalUUID(0x2A12),
    "time_source": canonicalUUID(0x2A13),
    "time_update_control_point": canonicalUUID(0x2A16),
    "time_update_state": canonicalUUID(0x2A17),
    "time_with_dst": canonicalUUID(0x2A11),
    "time_zone": canonicalUUID(0x2A0E),
    "true_wind_direction": canonicalUUID(0x2A71),
    "true_wind_speed": canonicalUUID(0x2A70),
    "two_zone_heart_rate_limit": canonicalUUID(0x2A95),
    "tx_power_level": canonicalUUID(0x2A07),
    "uncertainty": canonicalUUID(0x2AB4),
    "unread_alert_status": canonicalUUID(0x2A45),
    "user_control_point": canonicalUUID(0x2A9F),
    "user_index": canonicalUUID(0x2A9A),
    "uv_index": canonicalUUID(0x2A76),
    "vo2_max": canonicalUUID(0x2A96),
    "waist_circumference": canonicalUUID(0x2A97),
    "weight": canonicalUUID(0x2A98),
    "weight_measurement": canonicalUUID(0x2A9D),
    "weight_scale_feature": canonicalUUID(0x2A9E),
    "wind_chill": canonicalUUID(0x2A79)
  };

  BluetoothUUID.descriptor = {
    "gatt.characteristic_extended_properties": canonicalUUID(0x2900),
    "gatt.characteristic_user_description": canonicalUUID(0x2901),
    "gatt.client_characteristic_configuration": canonicalUUID(0x2902),
    "gatt.server_characteristic_configuration": canonicalUUID(0x2903),
    "gatt.characteristic_presentation_format": canonicalUUID(0x2904),
    "gatt.characteristic_aggregate_format": canonicalUUID(0x2905),
    "valid_range": canonicalUUID(0x2906),
    "external_report_reference": canonicalUUID(0x2907),
    "report_reference": canonicalUUID(0x2908),
    "value_trigger_setting": canonicalUUID(0x290A),
    "es_configuration": canonicalUUID(0x290B),
    "es_measurement": canonicalUUID(0x290C),
    "es_trigger_setting": canonicalUUID(0x290D)
  };

  function ResolveUUIDName(tableName) {
    var table = BluetoothUUID[tableName];
    return function (name) {
      if (typeof name === "number") {
        return canonicalUUID(name);
      } else if (uuidRegex.test(name.toLowerCase())) {
        //note native IOS bridges converts to uppercase since IOS seems to demand this.
        return name.toLowerCase();
      } else if (table.hasOwnProperty(name)) {
        return table[name];
      } else {
        throw new Error('SyntaxError: "' + name + '" is not a known ' + tableName + ' name.');
      }
    }
  }

  BluetoothUUID.getService = ResolveUUIDName('service');
  BluetoothUUID.getCharacteristic = ResolveUUIDName('characteristic');
  BluetoothUUID.getDescriptor = ResolveUUIDName('descriptor');


  var bluetooth = {};
  bluetooth.requestDevice = function (requestDeviceOptions) {
    if (!requestDeviceOptions.filters || requestDeviceOptions.filters.length === 0) {
      throw new TypeError('The first argument to navigator.bluetooth.requestDevice() must have a non-zero length filters parameter');
    }
    var validatedDeviceOptions = {}

    var filters = requestDeviceOptions.filters;
    filters = filters.map(function (filter) {
      return {
        services: filter.services.map(window.BluetoothUUID.getService),
        name: filter.name,
        namePrefix: filter.namePrefix
      };
    });
    validatedDeviceOptions.filters = filters;
    validatedDeviceOptions.name = filters;
    validatedDeviceOptions.filters = filters;


    var optionalServices = requestDeviceOptions.optionalService;
    if (optionalServices) {
      optionalServices = optionalServices.services.map(window.BluetoothUUID.getService)
      validatedDeviceOptions.optionalServices = optionalServices;
    }

    return sendMessage("bluetooth:requestDevice", validatedDeviceOptions)
      .then(function (deviceJSON) {
        var device = JSON.parse(deviceJSON);
        return new BluetoothDevice(device);
      }).catch(function (e) {
        console.log("Error starting to search for device", e);
      });
  }


  ////////////Communication with Native
  var _messageCount = 0;
  var _callbacks = {}; // callbacks for responses to requests

  function sendMessage(type, data) {

    var callbackID, message;
    callbackID = _messageCount;

    if (typeof type == 'undefined') {
      throw "CallRemote should never be called without a type!"
    }

    message = {
      type: type,
      data: data,
      callbackID: callbackID
    };

    console.log("<--", message);
    window.webkit.messageHandlers.bluetooth.postMessage(message);

    _messageCount++;
    return new Promise(function (resolve, reject) {
      _callbacks[callbackID] = function (success, result) {
        if (success) {
          resolve(result);
        } else {
          reject(result);
        }
        return delete _callbacks[callbackID];
      };
    });
  }

  function recieveMessage(messageType, success, resultString, callbackID) {
    console.log("-->", messageType, success, resultString, callbackID);

    switch (messageType) {
      case "response":
        console.log("result:", resultString)
        _callbacks[callbackID](success, resultString);
        break;
      default:
        console.log("Unrecognised message from native:" + message);
    }
  }

  function NamedError(name, message) {
    var e = new Error(message || '');
    e.name = name;
    return e;
  };

  //Safari 9 doesn't have TextDecoder API
  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }


  //Exposed interfaces
  window.BluetoothDevice = BluetoothDevice;
  window.BluetoothUUID = BluetoothUUID;
  window.recieveMessage = recieveMessage;
  navigator.bluetooth = bluetooth;
  window.BluetoothUUID = BluetoothUUID;

})();

            navigator.bluetooth.requestDevice({
                filters: [{
                    name: 'Trianswer02'
                }],
                optionalServices: ['713d0002-503e-4c75-ba94-3148f18d941e']
                //'713d0002-503e-4c75-ba94-3148f18d941e'
                //acceptAllDevices: true//
            })
            .then(device => {
                console.log(device);
                controller.currentDevice = device;
            });
        }

        function algorithm(byteValues){
            //let max = -200;
            //const lastPeakindex = 0;
            //let maxindex = 0;
            //let runningPeakindex = 0;
            //const indexThreshold = 200;
            //const waveThreshold = 50;
            //let m = [];
            //const sampleRate = 500;
            //let list = [];
            const st = controller.status;

            function HeartRateCalculation(x, x2){
                let heartrate = st.sampleRate * 60/ (x2 - x);
                console.log('heartrate: ' + heartrate);
                return heartrate;
            }

            /*function saveData(data){
                list.push(data);
            }*/
            
            //saveData(byteValues);
            //console.log('algo has');
            //console.log('array buffer' + byteValues.length );
            for (let i=0; i<byteValues.length; i++){
                //console.log('for has');
                if(st.max > byteValues[i]){
                    //console.log('1 has');
                    if((st.max - byteValues[i]) > st.waveThreshold){
                        console.log('2 has');
                        if(st.maxindex > st.indexThreshold){
                            st.heartrate = HeartRateCalculation(0, st.maxindex);
                            st.runningPeakindex = st.runningPeakindex - st.maxindex;
                            st.maxindex = 0;
                        }

                        else st.max = -200;
                    }
                }

                else{
                    //console.log('else has');
                    st.max = byteValues[i];
                    st.maxindex = st.runningPeakindex;
                }

                st.runningPeakindex += 1;
            }
        }
    }
    /**
     * 某台車子獲勝時，會呼叫的函數。
     * @param  {Car}       car 獲勝的那台車。
     * @return {undefined}
     */
    carWin(car){
        // 下面是最簡單的範例。
        alert(car.name + '獲勝。');
    }


    /**
     * 用來建立更新車子資料及介面的計時器。計時器會根據設定的週期，定時自動做某些事情。
     * @return {undefined}
     */
    startCarTimer(){
        const car_nodes = this.nodes['cars'].querySelectorAll('.car-scope');

        // 建立一個定時器，每carMoveInterval毫秒就會讓車子移動一次。
        this.status.carMoveTimer = setInterval(() => {
            // 如果沒有處於pass狀態，讓所有車往前移動。
            if ( !this.status.carMovePass ){
                this.cars.forEach((car, i) => {
                    //車子往前移動。
                    car.position += car.speed;
                    // 如果這輛車到達終點，就認定他獲勝。
                    if ( car.position >= this.status.trackLength ){
                        car.position = this.status.trackLength;
                        this.stopCarTimer();
                        this.carWin(car);
                    }
                    // 更新單台車子的元件介面
                    this.updateCarHTML(car_nodes[i], car);
                });
            }
        }, this.status.carMoveInterval);
    }
    /**
     * 用來清除(中止)讓車子資料更新的定時器的函數。清除後只能用startCarTimer()重啟。
     * @return {undefined}
     */
    stopCarTimer(){
        clearInterval(this.status.carMoveTimer);
        this.status.carMoveTimer = null;
    }
    /**
     * 僅用於建立Car物件，建立介面相關的程式碼則寫在createCarHTML()。
     * @param  {String} name
     * @return {undefined}
     */
    createCar(name){
        //如果name沒有給值，給定一個預設值。
        name = name || '車子' + (this.cars.length + 1).toString();

        const car = new Car(name);
        this.cars.push(car);

        this.nodes['cars'].appendChild(this.createCarHTML(car));
    }

    /**
     * 更新車子元件的內部介面。所有更新車子元件介面的程式都寫在這。
     * @param  {HTMLElement} node 必定是creaetCarHTML()創建出來的
     * @param  {Car}         car  Car物件
     * @return {undefined}
     */
    updateCarHTML(node, car){
        const car_node = node.querySelector('.car');
        
        //更新速度
        if(Math.abs(main_controller.status.heartrate - user.stdheartrate) < 10){
            main_controller.cars[0].speed = main_controller.cars[1].speed;
        }

        else{
            console.log('else');
            main_controller.cars[0].speed = main_controller.cars[1].speed * (1 - Math.abs(main_controller.status.heartrate - user.stdheartrate) / user.stdheartrate);
        }

        // 更新位置
        car_node.style.top = (100 * car.position / this.status.trackLength).toFixed(1) + '%';
    }
    /**
     * 建立一個用於介面的車子元件。
     * @param  {Car}         car Car物件
     * @return {HTMLElement} 
     */
    createCarHTML(car){
        const car_scope = simpleCreateHTML('div', 'car-scope');

        // 顯示名稱用
        car_scope.appendChild(simpleCreateHTML('div', 'car-name', car.name));

        // 跑道
        const track_node = simpleCreateHTML('div', 'car-track');
        // 車子本體
        const car_node = simpleCreateHTML('span', 'car');


        // 這個只是裝飾用的跑道線，無必要性。
        track_node.appendChild(simpleCreateHTML('div', 'track-line'));

        track_node.appendChild(car_node);
        car_scope.appendChild(track_node);

        return car_scope;
    }
}


/**
 * ===========================
 * 測試用
 */



const main_controller = new Controller();
main_controller.init(document.querySelector('#main'));

// 建兩台車當作測試
main_controller.createCar('you');
main_controller.createCar('standard');

main_controller.cars[1].speed = 1;










// 1. function check(t){                  等同    const check = t => t !== void 0 && t !== null;
//        return t != void && t != null;
//    }
// 2. check是一個指標，指向這個函數的參照
// 3. 用箭頭函數主要是this指向哪裡的問題，所以才不寫成function check()的形式
// 4. function check(){
//    return 1;
//     }
//    check = "blalba"
// 5. 因為不是const，所以你可以讓他指向別的東西，而原本的那個無名函數因為沒有人指向他了，JS會自動清
// 6. 不過像你也可以，              雖然check被改成字串，但因為還有a指向這個無名函數
//    function check(){
//    }
//    const a = check;
//    check = "blalba";
// 7. object.key(xxx) 將xxx的屬性列成陣列顯示
// 8. 意思是forEach是一個用來遍歷陣列的函數, 他forEach()裡面是可以寫一個函數，讓陣列裡的元素都做那個動作
// 9. classList.add(xxx) 在CSS加一個xxx名字的class
// 10. .後面是接該物件的成員變數，不是屬性
// 11. ...為展開運算子，參數不能是陣列，把他內容拿出來用
// 12. class Person {
//         constructor(n){
//             this.name = n;
//         }
//     }
//     const a = new Person('小明');
//     console.log(a.name); // 小明
// 13. 人有名字，所以在建構子裡寫一個this.name，代表這個人的名字、然後人會走路，於是你可以在這class Person裡寫一個walk()函數
// 14. this是指向被new出來的Controller本身     
// 15. this.nodes.cars和this.nodes['cars']是一樣的，sting寫法好處是可以使用不合法字元(一般只能英文數字底線)
// 16. this.nodes['cars']只是一個指標吧，指向cars_scope，之後函數會用到
// 17. 塞在nodes裡只是方便管理，假如有五六個HTML node，都集中放在裡面管理
// 18. 監聽函數寫在創建按鈕那才合理。
// 19. 事件觸發時，this會指向characteristic
// 20. 比方說，按鈕的click觸發時，this會指向按鈕本身
// 21. htmlelement的自訂attribute，一定要用data-開頭且不要用底線，這是w3c的標準，不符合標準某些瀏覽器會報錯有些不會，後面一樣可以用-號，看個人自由（？
// 22. 外面先讓controller儲存this後，alo裡要用controller.status.xxx存取你設的全域變數
// 23. 是function()裡的function()的裡面，this有很高機率指向不一樣的東西，但箭頭函數就很安全，這是箭頭函數的特性。
// 24. 對了，所以一般來說，函數內部的話，event的callback我習慣都寫成function(e){...}，其他函數則盡量用箭頭。
// 25. slice只是複製一個陣列而已，防止傳進函數後，陣列被動到而產生錯誤，複製一個新的再傳進去就沒這個問題。
// 26. 這樣講好了，有個class叫做Element，也就是HTMLElement，他是內建的class。而像我們Car就是自訂的class。
// 27. 一般來說我們Car物件來稱呼被new出來的Car，在你呼叫document.createElement()的時候，他就會回傳一個Element物件。
// 28. 再來解釋一下名詞，先看到Car裡的constructor，像this.name = 'xxx'，name就稱為Car的成員變數，而如果我在Car裡寫一個run()函數，run就被稱為Car的成員函數
// 29. 像init()就是Controller的成員函數，carWin()之類的也都是，而querySelector是Element的成員函數，所以只要Element物件都能呼叫他，document.createElement()回傳的都是Element物件
// 30. 而如果像你在index.html裡寫<div></div>，其實底層就是document.createElement('div')，只是瀏覽器偷偷做了你不知道。
// 31. 然後html裡是有父子結構的，像    bb是aa的子節點，aa是bb的父節點
//     <div id="aa">
//         <span id="bb"></span>
//     </div>
// 32. 節點的英文node，和Element物件是同樣的說法，id只是Element的成員變數
// 33. parentNode就只是取得他的父節點而已，因為querySelector只會搜尋所有子節點，但那些button都是同一層，沒有父子關係，所有得先跳到父節點才能搜尋。
// 34. div#aa
//         div#bb
//             div#cc
//     我這邊直接用簡寫，div#aa是css選擇器的語法，意思是一個id叫aa的div，cc是bb的子節點，bb是aa的子節點。
// 35. div#aa                b1的querySelector只能搜尋到cc，aa則可以b1 b2 cc b2c1 b2c2。
//         div#b1
//             div#cc
//         div#b2
//             div#b2c1
//             div#b2c2
// 36. then也是同個概念，你傳進一個callback，這個callback在resolve()時才會被系統呼叫
// 37. 是成員函數就要加.呼叫