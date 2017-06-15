Template.voiceDemo.onCreated(function(){
  //create a reactive dict that stores the status of user speaking
  this.voiceDict = new ReactiveDict();

  //set the status of the recording
  //inactive - user is not speaking or the recognition has ended
  //speaking - user is speaking
  //waiting - wait for the result from Google Speech API
  this.voiceDict.set("recording_status", "inactive");

  //set the status of API.ai request
  this.voiceDict.set("api_status", "inactive");
  this.voiceDict.set("API_recording", false);
  this.voiceDict.set("hasResult", false);

  //set the status of WAV files request
  this.voiceDict.set("WAV_files_status", "inactive");
  this.voiceDict.set("WAV_recording", false);

  //get the recordRTC package
  $.getScript("https://webrtcexperiment-webrtc.netdna-ssl.com/RecordRTC.js");
  $.getScript("https://webrtcexperiment-webrtc.netdna-ssl.com/gif-recorder.js");
  $.getScript("https://webrtcexperiment-webrtc.netdna-ssl.com/getScreenId.js");
})

Template.voiceDemo.helpers({
  ifInactive: function(){
    const voiceDict = Template.instance().voiceDict
    return voiceDict.get("recording_status") == "inactive";
  },

  ifSpeaking: function(){
    const voiceDict = Template.instance().voiceDict
    return voiceDict.get("recording_status") == "speaking";
  },

  ifWaiting: function(){
    const voiceDict = Template.instance().voiceDict
    return voiceDict.get("recording_status") == "waiting";
  },

  ifAPI: function(){
    const voiceDict = Template.instance().voiceDict
    return voiceDict.get("api_status") !== "waiting";
  },

  ifWAVRecording: function(){
    const voiceDict = Template.instance().voiceDict
    return voiceDict.get("WAV_recording");
  },

  ifAPIRecording: function(){
    const voiceDict = Template.instance().voiceDict
    return voiceDict.get("API_recording");
  },

  ifWAVProcessingDone: function() {
    return RecognitionResults.findOne({status: {$exists: true}}).status === "done";
  },

  hasResult: function(){
    const voiceDict = Template.instance().voiceDict
    return voiceDict.get("hasResult");
  },

  showWAVResults: function(){
    //reset the status
    const statusObjID = RecognitionResults.findOne({status: {$exists: true}})._id;

    Template.instance().voiceDict.set("WAV_files_status", "inactive");
    RecognitionResults.update(statusObjID, {
      status: "inactive"
    });
    $("#submitWAV").button("reset");
  },

  WAVAPIResults: function(){
    return RecognitionResults.find({status: {$exists: false}});
  },

  getText: function(result){
    return result[0];
  },

  getResultEntities: function(){
    return Template.instance().voiceDict.get("entitiesResult");
  },

  getIntentName: function(){
    return Template.instance().voiceDict.get("intentResult");
  },
})

Template.voiceDemo.events({
  "click #voiceIconMic": function(event){
    $("#recognitionBox").val("");
    const voiceDict = Template.instance().voiceDict;
    const template = Template.instance();

    //set the status to be speaking
    voiceDict.set("recording_status", "speaking");
    voiceDict.set("API_recording", true);
    voiceDict.set("hasResult", false);

    // request permission to access audio stream
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      // create media recorder instance to initialize recording
      var options = {
          recorderType: StereoAudioRecorder,
          mimeType: 'audio/wave',
          numberOfAudioChannels: 1,
          desiredSampRate: 16000,
      };

      var recorder = RecordRTC(stream, options);

      //save the varibles to the template
      template.recorderObject = recorder;
      template.stream = stream;

      //start recording
      recorder.startRecording();
    })
  },

  "click #recordAudioButton": function(event){
    const voiceDict = Template.instance().voiceDict;
    const template = Template.instance();

    //set the status to be speaking
    voiceDict.set("recording_status", "speaking");
    voiceDict.set("WAV_recording", true);

    // request permission to access audio stream
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      // create media recorder instance to initialize recording
      var options = {
          recorderType: StereoAudioRecorder,
          mimeType: 'audio/wave',
          numberOfAudioChannels: 1,
          desiredSampRate: 16000,
      };

      var recorder = RecordRTC(stream, options);

      //save the varibles to the template
      template.recorderObject = recorder;
      template.stream = stream;

      //start recording
      recorder.startRecording();
    })
  },

  "click #stopRecordAudioButton": function(){
    const voiceDict = Template.instance().voiceDict;
    var recorder = Template.instance().recorderObject;
    var stream = Template.instance().stream;

    //set the status to be waiting
    voiceDict.set("recording_status", "waiting");
    $("#stopRecordAudioButton").button("loading");

    recorder.stopRecording(function(){
      //get the recorded blob data and convert it to base64 form
      var blob = this.getBlob();
      var blobToBase64 = function(blob, callback) {
        var reader = new FileReader();
        reader.onload = function() {
          var dataUrl = reader.result;
          var base64 = dataUrl.split(',')[1];
          callback(base64);
        };
        reader.readAsDataURL(blob);
      };

      //send the data to the sever and save it to the local disk
      blobToBase64(blob, function(base64){ // encode
        Meteor.call("save_wav_files", base64, function(err, result){
          if(err){
            window.alert(err);
          }

          stream.getTracks()[0].stop();
          voiceDict.set("recording_status", "inactive");
          voiceDict.set("WAV_recording", false);
          console.log("WAV file saved here - " + result);
        })
      })
    })
  },

  "click #voiceIconSpeaking": function(){
    const voiceDict = Template.instance().voiceDict;
    var recorder = Template.instance().recorderObject;
    var stream = Template.instance().stream;

    //set the status to be waiting
    voiceDict.set("recording_status", "waiting");

    recorder.stopRecording(function(){
      //get the recorded blob data and convert it to base64 form
      var blob = this.getBlob();
      var blobToBase64 = function(blob, callback) {
        var reader = new FileReader();
        reader.onload = function() {
          var dataUrl = reader.result;
          var base64 = dataUrl.split(',')[1];
          callback(base64);
        };
        reader.readAsDataURL(blob);
      };

      //send the data to the sever and save it to the local disk
      blobToBase64(blob, function(base64){ // encode
        Meteor.call("send_audio_for_recognition", base64, function(err, result){
          if(err){
            window.alert(err);
          } else {
            $("#recognitionBox").val(result[0]);
          }

          stream.getTracks()[0].stop();
          voiceDict.set("recording_status", "inactive");
          voiceDict.set("API_recording", false);
        })
      })
    })
  },

  "click .js-submit-to-api-ai": function(event){
      //start only when the recorer is not active
      const voiceDict = Template.instance().voiceDict;
      if(voiceDict.get("recording_status") !== "inactive"){
        return;
      }

      //get the result text
      if($("#recognitionBox").val() !== ""){
        voiceDict.set("api_status", "waiting");
        const text = $("#recognitionBox").val();

        Meteor.call("send_text_for_APIAI_processing", text, function(err, result){
          if(err){
            window.alert(err);
            voiceDict.set("api_status", "inactive");
            return;
          }

          if(!!result.data.result.parameters){
            const parameters = result.data.result.parameters;
            const entities = [];

            //save results to ReactiveDict
            for(entity in parameters){
              if(parameters[entity]){
                entities.push({
                  name: entity,
                  value: parameters[entity]
                })
              }
            }

            voiceDict.set("entitiesResult", entities);
            voiceDict.set("intentResult", result.data.result.metadata.intentName);
          }

          voiceDict.set("api_status", "inactive");
          voiceDict.set("hasResult", true);
        });
      } else {
        window.alert("Plase type/say something first");
      }
  },

  "click #submitWAV": function(){
    $("#submitWAV").button("loading");
    const voiceDict = Template.instance().voiceDict
    Meteor.call("sned_wav_files_to_Google_Speech_API", function(err){
      if(err){
        window.alert(err);
        //reset the status
        const statusObjID = RecognitionResults.findOne({status: {$exists: true}})._id;

        voiceDict.set("WAV_files_status", "inactive");
        RecognitionResults.update(statusObjID, {
          status: "inactive"
        });
        $("#submitWAV").button("reset");
      }
    });
  },
})
