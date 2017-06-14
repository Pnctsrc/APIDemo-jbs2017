Router.configure({
	layoutTemplate: 'layout',
	//loadingTemplate: 'loading',
	//waitOn: function() {return true;}   // later we'll add more interesting things here ....
});

Router.route('/', {
	name: 'voiceDemo',
	waitOn: function(){
		return Meteor.subscribe("recognitionResults");
	}
});
