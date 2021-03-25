appl.initDevice = function(){
	$('html').addClass('-if-mob');
};

utils.overrideFunc(appl, 'initTmpl', function __func__(){
    __func__.origin.call(this);
	
	appl.initMobileTmpl();
});
	
	appl.initMobileTmpl = function(){
		tmplMgr.parseTemplates($('#mobile-templates'), true);
	};

appl.setValid = function(cls, fromValid){
	var cont = $('.body-wrp');
	
	cont.find('.glagna-form').append('<div class="glagna-valid-error"></div>');
	
	fromValid.errWrp = cont.find('.glagna-valid-error');
	
    cont.find(cls).isHappy(fromValid);
};

appl.animateBack.init = function(){};