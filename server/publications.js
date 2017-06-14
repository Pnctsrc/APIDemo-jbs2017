Meteor.publish("recognitionResults", function(){
    return RecognitionResults.find();
});
