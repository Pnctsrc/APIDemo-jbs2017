# APIDemo-jbs2017

This is a JBS 2017 Meteor demo app for Google Speech API and API.ai

## Before running

1. Execute the following to install all the required NPM packages
    ```
    Meteor npm install --save
    ```
2. In the project folder, create a settings.json file containing the following: <br>
    {<br>
        "voice_audio_path": "C:/some_folder/name_of_the_audio.wav" - **the path of the WAV file for the one-time recognition**<br>
        "APIAI_key": "1weqw" - **the client key of your API.ai agent**<br>
        "voice_input_path": "C:/some_folder/" - **the path of the folder where you put all your WAV recordings**<br>
    }
3. Set up Google Speech API - https://cloud.google.com/speech/
4. Install Google Cloud SDK - https://cloud.google.com/sdk/docs/
5. Open the SDK and execute the following command: <br>
    ```
    gcloud auth application-default login
    ```

## How to use
    Meteor --settings settings.json
