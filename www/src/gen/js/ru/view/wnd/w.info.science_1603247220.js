/**
	Попап с информацией о науке
*/

wScienceInfo = function(id, science){
	this.name = 'scienceinfo';
	
	wScienceInfo.superclass.constructor.apply(this, arguments);
    
    this.options.clipboard = true;	
};

utils.extend(wScienceInfo, Wnd);

WndMgr.regWnd('scienceinfo', wScienceInfo);


wScienceInfo.prepareData = function(id){
    return {science: Science.get(id)};
};


wScienceInfo.prototype.bindEvent = function() {
    var self = this;
    
    //показ прогноза
    this.wrp
		.on('click', '.scienceinfo-prognosisLink', function(){
			reqMgr.sciencePrognosis(self.data.science, function(resp){
				self.wrp.find('.scienceinfo-prognosis').html('<br/>Объем вкладываемых знаний повысится на ' + resp + '% для текущего состояния городов.');
				
				self.updScroll();
			});
		});
};

wScienceInfo.prototype.afterDraw = function(){
	this.setClipboard({tag:'s' + this.data.science.id});
	
	this.initScroll({scrollbarPosition: 'outside', advanced: {updateOnContentResize: false}});
};

wScienceInfo.prototype.getConflictWnd = wScienceInfo.prototype.getIdentWnd;