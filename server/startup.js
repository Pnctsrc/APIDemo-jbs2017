Meteor.startup(function(){
	RecognitionResults.remove({status: {$exists: false}});
	if(!RecognitionResults.findOne({status: {$exists: true}})){
		RecognitionResults.insert({status: "inactive"});
	} else {
		RecognitionResults.update({status: {$exists: true}}, {status: "inactive"});
	}
});
