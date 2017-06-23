const recording_settings = {
  input_path: "../../../../../pages/voiceDemo/audio/input/input.wav",
  wav_files: "../../../../../pages/voiceDemo/audio/wav_files/"
}

Meteor.methods({

    "send_audio_for_recognition": function(audioFile){
        const Speech = Npm.require('@google-cloud/speech');
        const speech = Speech();

        //write the audio file to local
        const fs = Npm.require("fs");
        var buf = new Buffer(audioFile, 'base64'); // decode
        fs.writeFileSync(recording_settings.input_path, buf)

        // Instantiates a client
        const speechClient = Speech({
          projectId: "api-aidemo"
        });

        // The name of the audio file to transcribe
        const filename = recording_settings.input_path;

        // The audio file's encoding, sample rate in hertz, and BCP-47 language code
        const options = {
          encoding: 'LINEAR16',
          //sampleRateHertz: 48000,
          languageCode: 'en-US'
        };

        // Detects speech in the audio file
        return speech.recognize(filename, options)
          .then((results) => {
            //delete the saved audio file
            fs.unlinkSync(filename);

            return results;
          })
          .catch((err) => {
            console.error('ERROR:', err);

            //delete the saved audio file
            fs.unlinkSync(filename);

            return err;
          })
    },

    "save_wav_files": function(audioFile){
      //write the audio file to local
      const fs = Npm.require("fs");
      var buf = new Buffer(audioFile, 'base64'); // decode
      const fileName = "Input-" + (new Date()).getTime() + ".wav";
      fs.writeFileSync(recording_settings.wav_files + fileName, buf);

      return recording_settings.wav_files + fileName;
    },

    "send_text_for_APIAI_processing": function(text){
        //validation for the option
        return HTTP.call("POST", "https://api.api.ai/v1/query/",
            {
                headers: {
                    "Authorization": "Bearer" + Meteor.settings.APIAI_key, //API.ai token here (from API.ai account)
                    "Content-Type": "application/json; charset=utf-8"
                },
                data: {
                  "query": text,
                  "lang": "en",
                  "sessionId": "1234567890"
            }
        })
    },

    "sned_wav_files_to_Google_Speech_API": function(){
        const fs = Npm.require("fs");
        const dirname = recording_settings.wav_files;
        RecognitionResults.remove({status: {$exists: false}});

        //save all path's of WAV files to an array
        var wavPaths = [];
        for(filename of fs.readdirSync(dirname)){
            var extension = filename.substring(filename.lastIndexOf(".") + 1);
            if(extension.toUpperCase() === "WAV"){
              wavPaths.push(dirname + filename);
            }
        }

        //check is there is any WAV file to submit
        if(wavPaths.length == 0){
          throw new Meteor.Error(301, "No WAV file found");
        }

        var count = 0;
        for(filePath of wavPaths){
            //make sync calls to google
            const Speech = Npm.require('@google-cloud/speech');
            const speech = Speech();
            const options = {
              encoding: 'LINEAR16',
              //sampleRateHertz: 48000,
              languageCode: 'en-US'
            };

            (function(filePathVar){
              speech.recognize(filePathVar, options)
              .then((result) => {
                count++;

                //when all the files have been processed
                const object_id = RecognitionResults.insert({
                  audioFile: filePathVar,
                  result: result
                })

                if(count == wavPaths.length){
                  if(!RecognitionResults.findOne({status: {$exists: true}})){
                    RecognitionResults.insert({
                      status: "done"
                    })
                  } else {
                    RecognitionResults.update({
                      status: {$exists: true}
                    }, {
                      status: "done"
                    });
                  }
                }

                //send the result to API.ai
                Meteor.call("send_text_for_APIAI_processing", result[0], function(err, APIresult){
                  if(err){
                    console.log(err);
                  } else {
                    //get the intent
                    const intentName = APIresult.data.result.metadata.intentName;

                    //get the entities
                    const entities = [];
                    const parameters = APIresult.data.result.parameters
                    for(entity in parameters){
                      if(parameters[entity]){
                        entities.push(entity);
                      }
                    }

                    //save the result to the database
                    RecognitionResults.update(object_id, {$push: {
                      intentName: intentName,
                      entities: entities
                    }})
                  }
                })
              })
              .catch((err) => {
                console.error('ERROR:', err);
                return err;
              })
            })(filePath);
        }
    },
})
