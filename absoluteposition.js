
/*
in ui.controls.js
    doAbsolutePositionZoom:function(delta) {
        camera.scale.z = delta;
        camera.scale.z = constrain( camera.scale.z, 0.8, 5.0 );
    },

    d3Graphs.doAbsolutePositionZoom(delta);
    */

  //Absolute position 3D coordinate global var
  var xCoordinate = 50;
  var yCoordinate = 50; 
  var zCoordinate = 50;

  var xCoordinateLast = 50;
  var yCoordinateLast = 50; 
  var zCoordinateLast = 50;

  let accelerometerData, objectTempData, ambientTempData, poseData;


  //3D model arm position sample data
 // var poseDataArray = []; 
  //sensor array sample data
  var sensorDataArray = new Array(18).fill(0); 

  //master session data array of arrays
  var sensorDataSession = [];
  var poseDataSession = [];

  //samples per position for display in ui
  var sensorSamplesPerPosition = new Array(28).fill(0); 

  //which samples in the session data array are part of a particular sample set
  var sessionSampleSetIndex = [];

  //track number of sets
  var numSets = 0; 

  var getSamplesFlag = 0;

  //do we have a trained NN to apply to live sensor data?
  var haveNNFlag = false;

  var trainNNFlag = false;

  var activeNNFlag = false;

  var updateCoordinatesFlag = false;

  //NN scores
  var scoreArray = new Array(28).fill(0);
  var fingerScoreArray = new Array(4).fill(0);

  //finger gesture selection
  var fingerSelect = false; //referenced in renderer.js line 47

  var doOnConnect = true;
  var haveBluetoothConnection = false;

  var initialised = false;
  var timeout = null;


  //range mapping 
  //example: var num = 5;
  //example: console.log(num.map(0, 10, -50, 50)); // 0
  Number.prototype.map = function (in_min, in_max, out_min, out_max) {
      return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  }

function initAbsolutePosition(){
	$("html").append("<style>.btn{display: inline-block;padding: 6px 12px;font-size: 18px;text-align: center;border-radius: 4px;width: 115px;background-color: #6b6b6b;color: #fff;}#absolute-position{position:absolute;z-index:9999;width:100%;}#coordinates,#info{color: white;position: absolute;top: 0px;left: 160px;font-size: 1.3rem;}#info{margin-top:30px;}#coordinates p , #info p {color:yellow; display: inline-block;}#info p {color:green;}</style>");
	$("body").append("<div id='absolute-position'><button id='connect' class='btn'>CONNECT</button><div id='message'></div><div id='coordinates'></div><div id='info'></div></div>");

	let button = document.getElementById("connect"); 
  	let message = document.getElementById("message");

	if ( 'bluetooth' in navigator === false ) {
	    button.style.display = 'none';
	    message.innerHTML = 'This browser doesn\'t support the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API" target="_blank">Web Bluetooth API</a> :(';
	}



  	button.onclick = function(e){
	    var sensorController = new ControllerWebBluetooth("Thermo");
	    sensorController.connect();

      // TRIGGERED ON BLUETOOTH NOTIFICATION SENSOR DATA RECEIVED
	    sensorController.onStateChange(function(state){

          haveBluetoothConnection = true;
          // THIS EXECUTES ONCE THE FIRST TIME WE GET DATA
          if(doOnConnect){
            console.log("DONE ON CONNECT");
              doOnConnect = false;

            // create a jQuery event
            e = $.Event('mousemove');


          }



  		      accelerometerData = state.accelerometer;
  		      objectTempData = state.objectTemp;
  		      ambientTempData = state.ambientTemp;

  		      getNNScore(); 

            //TRIGGER MOUSE MOVE EVENT TO SEND COORDINATES

            // create a jQuery event
    /*        e = $.Event('mousemove');

            // set coordinates
            e.pageX = Math.random() * 5;
            e.pageY = Math.random() * 5;

            // trigger event - must trigger on document
            $(document).trigger(e); */




	    });
  	}

  function getSensorData(){

    if(objectTempData){
      sensorDataArray[0] = objectTempData.a.toFixed(1);
      sensorDataArray[1] = objectTempData.b.toFixed(1);
      sensorDataArray[2] = objectTempData.c.toFixed(1);
      sensorDataArray[3] = objectTempData.d.toFixed(1);
      sensorDataArray[4] = objectTempData.e.toFixed(1);
      sensorDataArray[5] = objectTempData.f.toFixed(1);
      sensorDataArray[6] = objectTempData.g.toFixed(1);
      sensorDataArray[7] = objectTempData.h.toFixed(1);
      sensorDataArray[8] = objectTempData.i.toFixed(1);
      sensorDataArray[9] = objectTempData.j.toFixed(1);
      sensorDataArray[10] = objectTempData.k.toFixed(1);
      sensorDataArray[11] = objectTempData.l.toFixed(1);
      sensorDataArray[12] = objectTempData.m.toFixed(1);
      sensorDataArray[13] = objectTempData.n.toFixed(1);
      sensorDataArray[14] = objectTempData.o.toFixed(1);
  //    sensorDataArray[18] = objectTempData.p.toFixed(1);
    }

    if(ambientTempData){
      sensorDataArray[15] = ambientTempData.a.toFixed(1);
    } 

    if(accelerometerData){
      sensorDataArray[16] = accelerometerData.pitch.toFixed(1);
      sensorDataArray[17] = accelerometerData.roll.toFixed(1);
    }



  }



  /*******************************************************************************************************************
  *********************************************** NEURAL NETWORK *****************************************************
  ********************************************************************************************************************/
    /**
   * Attach synaptic neural net components to app object
   *//*
  var Neuron = synaptic.Neuron;
  var Layer = synaptic.Layer;
  var Network = synaptic.Network;
  var Trainer = synaptic.Trainer;
  var Architect = synaptic.Architect;
  //var neuralNet = new Architect.LSTM(19, 75, 75);
  var neuralNet = new Architect.LSTM(19, 19, 19, 21);
  var trainer = new Trainer(neuralNet);
  var trainingData;
  */


function getNNScore(){
//	scoreArray = new Array(75).fill(0);



  scoreArray = new Array(28).fill(0);

  fingerScoreArray =  new Array(4).fill(0);

  getSensorData();

  var feedArray = new Array(18).fill(0);
        feedArray[0] = sensorDataArray[0] / 101;
        feedArray[1] = sensorDataArray[1] / 101;
        feedArray[2] = sensorDataArray[2] / 101;
        feedArray[3] = sensorDataArray[3] / 101;
        feedArray[4] = sensorDataArray[4] / 101;
        feedArray[5] = sensorDataArray[5] / 101;
        feedArray[6] = sensorDataArray[6] / 101;
        feedArray[7] = sensorDataArray[7] / 101;
        feedArray[8] = sensorDataArray[8] / 101;
        feedArray[9] = sensorDataArray[9] / 101;
        feedArray[10] = sensorDataArray[10] / 101;
        feedArray[11] = sensorDataArray[11] / 101;
        feedArray[12] = sensorDataArray[12] / 101;
        feedArray[13] = sensorDataArray[13] / 101;
        feedArray[14] = sensorDataArray[14] / 101;
        feedArray[15] = sensorDataArray[15] / 101;
        feedArray[16] = sensorDataArray[16] / 360;
        feedArray[17] = sensorDataArray[17] / 360;

  var positionFeedArray = new Array(12).fill(0);
        positionFeedArray[0] = sensorDataArray[0] / 101;
  //      positionFeedArray[1] = sensorDataArray[1] / 101;
        positionFeedArray[1] = sensorDataArray[2] / 101;
  //      positionFeedArray[3] = sensorDataArray[3] / 101;
        positionFeedArray[2] = sensorDataArray[4] / 101;
        positionFeedArray[3] = sensorDataArray[5] / 101;
        positionFeedArray[4] = sensorDataArray[6] / 101;
  //      positionFeedArray[7] = sensorDataArray[7] / 101;
        positionFeedArray[5] = sensorDataArray[8] / 101;
        positionFeedArray[6] = sensorDataArray[9] / 101;
  //      positionFeedArray[10] = sensorDataArray[10] / 101;
        positionFeedArray[7] = sensorDataArray[11] / 101;
        positionFeedArray[8] = sensorDataArray[12] / 101;
  //      positionFeedArray[13] = sensorDataArray[13] / 101;
        positionFeedArray[9] = sensorDataArray[14] / 101;
        positionFeedArray[10] = sensorDataArray[16] / 360;
        positionFeedArray[11] = sensorDataArray[17] / 360;

  var fingerFeedArray = new Array(5).fill(0);
        fingerFeedArray[0] = sensorDataArray[1] / 101; //T2
        fingerFeedArray[1] = sensorDataArray[3] / 101; //T4
        fingerFeedArray[2] = sensorDataArray[7] / 101; //T8
        fingerFeedArray[3] = sensorDataArray[10] / 101; //T11
        fingerFeedArray[4] = sensorDataArray[13] / 101; //T14

  

    console.log("SENSOR DATA:");
  //  for(var t = 0; t <18; t++){
  //  	console.log(sensorDataArray[t].fixed(3) + " ");
  //  }

  //  scoreArray = neuralNet.activate(feedArray);
    scoreArray = neuralNetwork(positionFeedArray); 
 //   console.log("POSITION FEED ARRAY: " + feedArray);
  //  console.log("POSITION SCORE ARRAY: " + scoreArray);

    fingerScoreArray =  fingerNNetwork(fingerFeedArray);
  //  console.log("FINGER FEED ARRAY: " + fingerFeedArray);
  //  console.log("FINGER SCORE ARRAY: " + fingerScoreArray);

    $("#info").html("OPEN: <p>" + fingerScoreArray[0].toFixed(1) + "</p>   CLOSED: <p>" + fingerScoreArray[1].toFixed(1) + "</p>");


    /*************** USER FINGER GESTURE SELECTION *****************/
    /*************** USER FINGER GESTURE SELECTION *****************/
    /*************** USER FINGER GESTURE SELECTION *****************/
    /*************** USER FINGER GESTURE SELECTION *****************/
    if(fingerScoreArray[1] > (fingerScoreArray[0]/2) && fingerScoreArray[1] > 0.3){
        fingerSelect = true;
        //default is 0.25
    //    radius = .25 + 0.75*fingerScoreArray[1];

    } else{// if(fingerScoreArray[1] < fingerScoreArray[0] /* && fingerSelect == true */){ 
        fingerSelect = false; 

   //     radius = 0.25;
    }




    getCoordinates(scoreArray); 
}

  function getCoordinates(firstPlace, secondPlace, thirdPlace){

      var positionCoordinates = [
        {x: 0,   y: 100, z: 100},   //1
        {x: 0,   y: 100, z: 0},     //2
        {x: 33,  y: 100, z: 100},   //3
        {x: 33,  y: 100, z: 0},     //4
        {x: 66,  y: 100, z: 100},   //5
        {x: 66,  y: 100, z: 0},     //6
        {x: 100, y: 100, z: 100},   //7
        {x: 100, y: 100, z: 0},   //8

        {x: 0,   y: 50,  z: 100},   //9
        {x: 0,   y: 50,  z: 50},  //10
        {x: 0,   y: 50,  z: 0},   //11
        {x: 33,  y: 50,  z: 100},   //12
        {x: 33,  y: 50,  z: 50},  //13
        {x: 33,  y: 50,  z: 0},   //14
        {x: 66,  y: 50,  z: 100},   //15
        {x: 66,  y: 50,  z: 50},  //16
        {x: 66,  y: 50,  z: 0},   //17
        {x: 100, y: 50,  z: 100},   //18
        {x: 100, y: 50,  z: 50},  //19
        {x: 100, y: 50,  z: 0},     //20

        {x: 0,   y: 0,   z: 100},   //21
        {x: 0,   y: 0,   z: 0},   //22
        {x: 33,  y: 0,   z: 100},   //23
        {x: 33,  y: 0,   z: 0},   //24
        {x: 66,  y: 0,   z: 100},   //25
        {x: 66,  y: 0,   z: 0},   //26
        {x: 100, y: 0,   z: 100},   //27
        {x: 100, y: 0,   z: 0}    //28
      ];
      


      //TOP POSITIONS METHOD
      var firstPlace = {position: 0, score: 0}; 
      var secondPlace = {position: 0, score: 0};  
      var thirdPlace = {position: 0, score: 0}; 

      for(var i=0; i<28;i++){

          var scoreForColor = scoreArray[i];

          if(scoreForColor > firstPlace.score  ){
            thirdPlace.position = secondPlace.position;
            thirdPlace.score = secondPlace.score;
            secondPlace.position = firstPlace.position;
            secondPlace.score = firstPlace.score;
            firstPlace.position = i;
            firstPlace.score = scoreForColor;
          } else if(scoreForColor > secondPlace.score && firstPlace.position != i ){
            thirdPlace.position = secondPlace.position;
            thirdPlace.score = secondPlace.score;
            secondPlace.score = scoreForColor;
            secondPlace.position = i;
          } else if(scoreForColor > thirdPlace.score && firstPlace.position != i  && secondPlace.position != i){
            thirdPlace.score = scoreForColor;
            thirdPlace.position = i;
          }
      }
      console.log("FIRST: " + firstPlace.position + " SECOND: " + secondPlace.position + " THIRD: " + thirdPlace.position + "   (0-27");

      // AVERAGE OF ALL POSITIONS METHOD
      var xCoordinateNew = ((firstPlace.score * positionCoordinates[firstPlace.position].x)*2 + (secondPlace.score * positionCoordinates[secondPlace.position].x)*1.5 + (thirdPlace.score * positionCoordinates[thirdPlace.position].x)) / (firstPlace.score*2 + secondPlace.score*1.5 + thirdPlace.score);
      var yCoordinateNew = ((firstPlace.score * positionCoordinates[firstPlace.position].y)*2 + (secondPlace.score * positionCoordinates[secondPlace.position].y)*1.5 + (thirdPlace.score * positionCoordinates[thirdPlace.position].y)) / (firstPlace.score*2 + secondPlace.score*1.5 + thirdPlace.score);
      var zCoordinateNew = ((firstPlace.score * positionCoordinates[firstPlace.position].z)*2 + (secondPlace.score * positionCoordinates[secondPlace.position].z)*1.5 + (thirdPlace.score * positionCoordinates[thirdPlace.position].z)) / (firstPlace.score*2 + secondPlace.score*1.5 + thirdPlace.score);
        
      var numeratorX = 0; var numeratorY = 0; var numeratorZ = 0; var denominatorX = 0; var denominatorY = 0; var denominatorZ = 0; var currentScore;
      var numeratorX2 = 0; var numeratorY2 = 0; var numeratorZ2 = 0; var denominatorX2 = 0; var denominatorY2 = 0; var denominatorZ2 = 0; var currentScore2;

      //USING CUTOFF
      for(var i=0; i<28;i++){
          currentScore = scoreArray[i];

          if(currentScore > 0.05){ //cutoff for score to count
            numeratorX = numeratorX + (currentScore * positionCoordinates[i].x);
            numeratorY = numeratorY + (currentScore * positionCoordinates[i].y);
            numeratorZ = numeratorZ + (currentScore * positionCoordinates[i].z);

            denominatorX = denominatorX + currentScore;
            denominatorY = denominatorY + currentScore;
            denominatorZ = denominatorZ + currentScore;
          }
      }
      var xCoordinateNew2 = numeratorX / denominatorX;
      var yCoordinateNew2 = numeratorY / denominatorY;
      var zCoordinateNew2 = numeratorZ / denominatorZ;

      //USING SQUARE VALUE
      for(var j=0; i<28;j++){

          currentScore2 = scoreArray[j] * scoreArray[j]; //use square value

          console.log("$$ CURRENTSCORE@: " + currentScore2);

          if(currentScore > 0.001){ //cutoff for score to count

              numeratorX2 = numeratorX2 + (currentScore2 * positionCoordinates[j].x);
              numeratorY2 = numeratorY2 + (currentScore2 * positionCoordinates[j].y);
              numeratorZ2 = numeratorZ2 + (currentScore2 * positionCoordinates[j].z);

              denominatorX2 = denominatorX2 + currentScore2;
              denominatorY2 = denominatorY2 + currentScore2;
              denominatorZ2 = denominatorZ2 + currentScore2;
          }
      }
      var xCoordinateNew3 = numeratorX2 / denominatorX2;
      var yCoordinateNew3 = numeratorY2 / denominatorY2;
      var zCoordinateNew3 = numeratorZ2 / denominatorZ2;

      //smooth by averaging with last coordinate


   //   xCoordinate = (xCoordinate*3 + xCoordinateNew2)/4;
  //    yCoordinate = (yCoordinate*3 + yCoordinateNew2)/4;
  //    zCoordinate = (zCoordinate*3 + zCoordinateNew2)/4;
      if(xCoordinate > 99){xCoordinate = 99;} 
      else if(xCoordinate < 1){xCoordinate = 1;} 
      else if(xCoordinate >= 1 && xCoordinate <= 99) { xCoordinate = (xCoordinate*5 + xCoordinateNew2)/6; } 
      else {xCoordinate = 1;}  

      if(yCoordinate > 99){yCoordinate = 99;} 
      else if(yCoordinate < 1){yCoordinate = 1;} 
      else if(yCoordinate >= 1 && yCoordinate <= 99) { yCoordinate = (yCoordinate*5 + yCoordinateNew2)/6; } 
      else {yCoordinate = 1;}   

      if(zCoordinate > 99){zCoordinate = 99;} 
      else if(zCoordinate < 1){zCoordinate = 1;} 
      else if(zCoordinate >= 1 && zCoordinate <= 99) { zCoordinate = (zCoordinate*5 + zCoordinateNew2)/6; } 
      else {zCoordinate = 1;}  
          

   //   xCoordinate = (xCoordinateLast + xCoordinateNew2)/2;
    //  yCoordinate = (yCoordinateLast + yCoordinateNew2)/2;
    //  zCoordinate = (zCoordinateLast + zCoordinateNew2)/2;
      xCoordinateLast = xCoordinate; yCoordinateLast = yCoordinate; zCoordinateLast = zCoordinate;
      updateCoordinatesFlag =  true;

       //     xCoordinate = xCoordinateNew2;
 //     yCoordinate = yCoordinateNew2;
  //    zCoordinate =  zCoordinateNew2;


      $("#coordinates").html("X: <p>" + xCoordinate.toFixed(1) + "</p>   Y: <p>" + yCoordinate.toFixed(1) + "</p>   Z: <p>" + zCoordinate.toFixed(1) + "</p>     X2: <p>" + xCoordinateNew2.toFixed(1) + "</p>   Y2: <p>" + yCoordinateNew2.toFixed(1) + "</p>   Z2: <p>" + zCoordinateNew2.toFixed(1) + "</p>     X3: <p>" + xCoordinateNew3.toFixed(1) + "</p>   Y3: <p>" + yCoordinateNew3.toFixed(1) + "</p>   Z3: <p>" + zCoordinateNew3.toFixed(1) + "</p>");
     //   $("#absolute-position").css({"top": (100 - yCoordinate) + "%", "left": xCoordinate + "%", "font-size": ((100 - zCoordinate) / 6 + 5) + "rem"});
        
        //!!!!!!!!!! REVERSE X and Z FOR MODEL WEB APP
      //  xCoordinate = 100 - xCoordinate;
      //  zCoordinate = 100 - zCoordinate;
  }



  /*******************************************************************************************************************
  *********************************************** WEB BLUETOOTH ******************************************************
  ********************************************************************************************************************/

	const services = {
	  controlService: {
	    name: 'control service',
	    uuid: '0000a009-0000-1000-8000-00805f9b34fb'
	  }
	}

	const characteristics = {
	  commandReadCharacteristic: {
	    name: 'command read characteristic',
	    uuid: '0000a001-0000-1000-8000-00805f9b34fb'
	  },
	  commandWriteCharacteristic: {
	    name: 'command write characteristic',
	    uuid: '0000a002-0000-1000-8000-00805f9b34fb'
	  },
	  imuDataCharacteristic: {
	    name: 'imu data characteristic',
	    uuid: '0000a003-0000-1000-8000-00805f9b34fb'
	  }
	}

	var _this;
	var state = {};
	var previousPose;

	class ControllerWebBluetooth{
		  constructor(name){
		    _this = this;
		    this.name = name;
		    this.services = services;
		    this.characteristics = characteristics;

		    this.standardServer;
		  }

		  connect(){
		    return navigator.bluetooth.requestDevice({
		      filters: [
		        {name: this.name},
		        {
		          services: [ services.controlService.uuid]
		        }
		      ]
		    })
		    .then(device => {
		      console.log('Device discovered', device.name);
		      return device.gatt.connect();
		    })
		    .then(server => {
		      console.log('server device: '+ Object.keys(server.device));

		      this.getServices([services.controlService,], [characteristics.commandReadCharacteristic, characteristics.commandWriteCharacteristic, characteristics.imuDataCharacteristic], server);
		    })
		    .catch(error => {console.log('error',error)})
		  }

		  getServices(requestedServices, requestedCharacteristics, server){
		    this.standardServer = server;

		    requestedServices.filter((service) => {
		      if(service.uuid == services.controlService.uuid){
		        _this.getControlService(requestedServices, requestedCharacteristics, this.standardServer);
		      }
		    })
		  }

		  getControlService(requestedServices, requestedCharacteristics, server){
		      let controlService = requestedServices.filter((service) => { return service.uuid == services.controlService.uuid});
		      let commandReadChar = requestedCharacteristics.filter((char) => {return char.uuid == characteristics.commandReadCharacteristic.uuid});
		      let commandWriteChar = requestedCharacteristics.filter((char) => {return char.uuid == characteristics.commandWriteCharacteristic.uuid});

		      // Before having access to IMU, EMG and Pose data, we need to indicate to the Myo that we want to receive this data.
		      return server.getPrimaryService(controlService[0].uuid)
		      .then(service => {
		        console.log('getting service: ', controlService[0].name);
		        return service.getCharacteristic(commandWriteChar[0].uuid);
		      })
		      .then(characteristic => {
		        console.log('getting characteristic: ', commandWriteChar[0].name);
		        // return new Buffer([0x01,3,emg_mode,imu_mode,classifier_mode]);
		        // The values passed in the buffer indicate that we want to receive all data without restriction;
		        let commandValue = new Uint8Array([0x01,3,0x02,0x03,0x01]);
		        characteristic.writeValue(commandValue);
		      })
		      .then(_ => {

		        let IMUDataChar = requestedCharacteristics.filter((char) => {return char.uuid == characteristics.imuDataCharacteristic.uuid});

		          console.log('getting service: ', controlService[0].name);
		          _this.getIMUData(controlService[0], IMUDataChar[0], server);

		      })
		      .catch(error =>{
		        console.log('error: ', error);
		      })
		  }


		  handleIMUDataChanged(event){
		    //byteLength of ImuData DataView object is 20.
		    // imuData return {{orientation: {w: *, x: *, y: *, z: *}, accelerometer: Array, gyroscope: Array}}
		    let imuData = event.target.value;

		    //add 65 and multiply by 7 to decompress thermopile data
		    let objectTemp1 = ( event.target.value.getUint8(0) / 8) + 70;
		    let objectTemp2 = ( event.target.value.getUint8(1) / 8) + 70;
		    let objectTemp3 = ( event.target.value.getUint8(2) / 8) + 70;
		    let objectTemp4 = ( event.target.value.getUint8(3) / 8) + 70;
		    let objectTemp5 = ( event.target.value.getUint8(4) / 8) + 70;
		    let objectTemp6 = ( event.target.value.getUint8(5) / 8) + 70;
		    let objectTemp7 = ( event.target.value.getUint8(6) / 8) + 70;
		    let objectTemp8 = ( event.target.value.getUint8(7) / 8) + 70;
		    let objectTemp9 = ( event.target.value.getUint8(8) / 8) + 70;
		    let objectTemp10 = ( event.target.value.getUint8(9) / 8) + 70;
		    let objectTemp11 = ( event.target.value.getUint8(10) / 8) + 70;
		    let objectTemp12 = ( event.target.value.getUint8(11) / 8) + 70;
		    let objectTemp13 = ( event.target.value.getUint8(12) / 8) + 70;
		    let objectTemp14 = ( event.target.value.getUint8(13) / 8) + 70;
		    let objectTemp15 = ( event.target.value.getUint8(14) / 8) + 70;
  //  let objectTemp16 = ( event.target.value.getUint8(15) / 7) + 70;

    let ambientAverage = ( event.target.value.getUint8(16) / 8) + 70;

 //   let accelerometerX = (event.target.value.getUint8(17) / 100) - 1;
 //   let accelerometerY = (event.target.value.getUint8(18) / 100) - 1;
 //   let accelerometerZ = (event.target.value.getUint8(19) / 100) - 1;

 //   let accelerometerX = (event.target.value.getUint8(17) * 1.4);
    let accelerometerPitch = (event.target.value.getUint8(18) * 1.4);
    let accelerometerRoll = (event.target.value.getUint8(19) * 1.4);

		    var data = {
          accelerometer: {
            pitch: accelerometerPitch,
            roll: accelerometerRoll
          },
		      objectTemp: {
		        a: objectTemp1,
		        b: objectTemp2,
		        c: objectTemp3,
		        d: objectTemp4,
		        e: objectTemp5,
		        f: objectTemp6,
		        g: objectTemp7,
		        h: objectTemp8,
		        i: objectTemp9,
		        j: objectTemp10,
		        k: objectTemp11,
		        l: objectTemp12,
		        m: objectTemp13,
		        n: objectTemp14,
		        o: objectTemp15,
		      },
		      ambientTemp: {
		        a: ambientAverage
		      }
		    }

		    state = {
		      accelerometer: data.accelerometer,
		      objectTemp: data.objectTemp,
		      ambientTemp: data.ambientTemp
		    }

		    _this.onStateChangeCallback(state);
		  }

		  onStateChangeCallback() {}

		  getIMUData(service, characteristic, server){
		    return server.getPrimaryService(service.uuid)
		    .then(newService => {
		      console.log('getting characteristic: ', characteristic.name);
		      return newService.getCharacteristic(characteristic.uuid)
		    })
		    .then(char => {
		      char.startNotifications().then(res => {
		        char.addEventListener('characteristicvaluechanged', _this.handleIMUDataChanged);
		      })
		    })
		  }

    handlePoseChanged(event){

      _this.onStateChangeCallback(state);
    }

    eventArmSynced(arm, x_direction){
      armType = (arm == 1) ? 'right' : ((arm == 2) ? 'left' : 'unknown');
      myoDirection = (x_direction == 1) ? 'wrist' : ((x_direction == 2) ? 'elbow' : 'unknown');

      state.armType = armType;
      state.myoDirection = myoDirection;

      _this.onStateChangeCallback(state);
    }

    onStateChange(callback){
      _this.onStateChangeCallback = callback;
    }

	} //end class constructor

} //end on window load