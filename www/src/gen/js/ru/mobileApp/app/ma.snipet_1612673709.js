snip.getSliderTypeCls = function(type){
    return '-type-' + type + '-mobApp';
};

utils.overrideFunc(snip, 'sliderHandler', function __func__($el, opt){
    opt = opt||{};
	
	if( opt.create )
		opt.createUser2 = opt.create;
	if( opt.slide )
		opt.slideOrigin = opt.slide;
	if( opt.change )
		opt.changeOrigin = opt.change;
    
	opt.create = function(e, ui){
        var $slider = $(this),
            $sliderGrad = $slider.find('.ui-slider-grad');
        
        if( !$sliderGrad.length ){
            $sliderGrad = $('<div></div>').addClass('ui-slider-grad');
            
            $slider.append($sliderGrad);
        }
        
        $slider.data('$sliderGrad', $sliderGrad);
        
        // Перегружаем функцию option и обнавляем градиент слайдера если были изменены параметры
        $.data(this).uiSlider.option = function(key, value){
            var result = Object.getPrototypeOf(this).option.apply(this, arguments);
            
            if( typeof(key) == 'object' || value !== undefined )
                snip.sliderHandler.updSliderGrad(this.element);
            
            return result;
        };
        
		snip.sliderHandler.updSliderGrad($slider);
		
        snip.sliderHandler.initSmoothSlide($slider);
        
		var func = $slider.slider('option', 'createUser2');
		
		if( func )
			func.apply(this, arguments);
	};
	opt.slide = function(e, ui){
		snip.sliderHandler.updSliderGrad($(this), ui.value);
		
		var func = $(this).slider('option', 'slideOrigin');
		
		if( func )
			func.apply(this, arguments);
	};
	opt.change = function(e, ui){
		snip.sliderHandler.updSliderGrad($(this), ui.value);
		
		var func = $(this).slider('option', 'changeOrigin');
		
		if( func )
			func.apply(this, arguments);
	};
	
	return __func__.origin.apply(snip, arguments);
});
	// Исключительно визуальная надстройка. На внутреннюю механику слайдера не влияет 
    snip.sliderHandler.initSmoothSlide = function($slider){
        var $sliderHandle = $slider.find('.ui-slider-handle'),
            smoothSlidingInfo = null,
            smoothSlidingAnimTO,
            smoothSlidingAnimPrepareTO,
            smoothSlidingAnimDelayTO,
            clearAllSmoothSlidingAnimTO = function(){
                clearTimeout(smoothSlidingAnimTO);
                clearTimeout(smoothSlidingAnimPrepareTO);
                clearTimeout(smoothSlidingAnimDelayTO);
            },
            setSmoothSlidingTimeout = function(){
                smoothSlidingAnimTO = setTimeout(function(){
                    $slider.removeClass('-state-animation');
                }, 250);
            };

        $slider
            .on('slider_smoothslidestart', function(e, dragg){
                clearAllSmoothSlidingAnimTO();
                
                if( $slider.hasClass('-state-animation') ){
                    if( !dragg ){
                        setSmoothSlidingTimeout();
                        
                        return;
                    }
                }
                
                $slider
                        .addClass('-state-smoothSliding')
                        .removeClass('-state-animation');
                
                smoothSlidingInfo = {
                    percent: +($sliderHandle.attr('style').match(/left:[ ]*([\d.]+)[%]/)[1]||'0')
                };
                
                $sliderHandle
                            .css('right', (100 - smoothSlidingInfo.percent) + '%')
                            .addClass('slider-handle-fixLeftPos');
                
                snip.sliderHandler.updSliderGrad($slider, undefined, smoothSlidingInfo.percent);
            })
            .on('touchmove', function(e){
                if( !smoothSlidingInfo )
                    return;
                
                e = e.originalEvent||e;
                
                var rect = this.getBoundingClientRect();
                
                smoothSlidingInfo.percent = Math.min(1, Math.max(0, utils.getPosFromEvent(e.touches[0]).x - rect.left) / rect.width) * 100;
                
                $sliderHandle.css('right', (100 - smoothSlidingInfo.percent) + '%');
                
                snip.sliderHandler.updSliderGrad($slider, undefined, smoothSlidingInfo.percent);
            })
            .on('touchend touchcancel slider_smoothslideend',function(e){
                if( !smoothSlidingInfo )
                    return;          

                var percent = +($sliderHandle.attr('style').match(/left:[ ]*([\d.]+)[%]/)[1]||'0');
                
                if( Math.abs(percent - smoothSlidingInfo.percent) > 1 ){
                    $sliderHandle
                                .css({right: '', left: smoothSlidingInfo.percent + '%'})
                                .removeClass('slider-handle-fixLeftPos');
                    
                    snip.sliderHandler.updSliderGrad($slider, undefined, smoothSlidingInfo.percent); 
                    
                    clearAllSmoothSlidingAnimTO();
                    
                    // Устанавливаем задержки, чтобы корректно прменялись начальные значения до начала анимации
                    smoothSlidingAnimPrepareTO = setTimeout(function(){
                        $slider.addClass('-state-animation');
                        
                        smoothSlidingAnimDelayTO = setTimeout(function(){
                            $sliderHandle.css({left: percent + '%'});

                            snip.sliderHandler.updSliderGrad($slider, undefined, percent);               

                            setSmoothSlidingTimeout();
                        }, 50);
                    }, 0);
                }
                else
                    $sliderHandle.css({right: ''}).removeClass('slider-handle-fixLeftPos');
                
                $slider.removeClass('-state-smoothSliding');
                
                smoothSlidingInfo = null;
            });
    };
    
	snip.sliderHandler.updSliderGrad = function($slider, value, percent){
        if( percent === undefined ){
            if( $slider.hasClass('-state-smoothSliding') )
                return;
            
            value = value === undefined ? $slider.slider('value') : value;
            
            var option = $slider.slider('option');

            percent = (value - option.min)/(option.max - option.min) * 100;            
        }
		
		$slider.data('$sliderGrad').css('width', percent + '%');
	};
    
    
    
utils.overrideFunc(snip, 'resStockWarnHas', function __func__(res, short){
    return __func__.origin.call(snip, res, short ? snip.getShortNumFormatOpt(res.has) : undefined);
});

snip.resStockWarnHasColor = function(res){
    if( !res.isStockable() )
        return snip.c.warn.white;
    
    if( utils.toInt(res.has) == utils.toInt(res.town.getStock().getMax()) )
        return snip.c.warn.lblue;
    
    if( res.updateHour == 0 )
        return snip.c.warn.white;

    var inc = res.updateHour > 0,
        fill = res.calcStockFillTime();
    
    if( inc )
        return fill <= 6 * 3600 ? snip.c.warn.purple : snip.c.warn.lgreen;
    else{
        if( fill <= 6 * 3600 )
            return snip.c.warn.red;
        else if( fill <= 12 * 3600 )
            return snip.c.warn.brown;
        else
            return snip.c.warn.pink;
    }
};

snip.resStockWarnUpdColor = function(res){
    if( res.isStockable() ){
        if( res.updateHour > 0 && utils.toInt(res.has) == utils.toInt(res.town.getStock().getMax()) ) 
            return snip.c.warn.grey;
        
        var inc = res.updateHour > 0,
            fill = res.calcStockFillTime();
        
        if( inc )
            return fill <= 6 * 3600 ? snip.c.warn.purple : snip.c.warn.lgreen;
        else{
            if( fill <= 6 * 3600 )
                return snip.c.warn.red;
            else if( fill <= 12 * 3600 )
                return snip.c.warn.brown;
            else
                return snip.c.warn.pink;
        }
    } 
    else{
        if( res.updateHour == 0 )
            return snip.c.warn.grey;
        
        return res.updateHour > 0 ? snip.c.warn.lgreen : snip.c.warn.red;
    }
};

snip.getShortNumFormatOpt = function(val, opt){
    opt = opt||{};
    
    opt.KM = {minK: 1e3, minM: 1e6};
    opt.uFixed = 1;
    opt.int = val >= 1e8 ? true : (val < 1e6 && val >= 1e4) || val < 1e3 ? true : false;
    opt.toNum = true;
    
    return opt;
};


snip.orientationCont = function(portraitCont, landscapeCont){
    return snip.portraitCont(portraitCont) +  snip.landscapeCont(landscapeCont);
};

snip.portraitCont = function(cont){
    return snip.wrp('-only-portrait', '' + cont);
};

snip.landscapeCont = function(cont){
    return snip.wrp('-only-landscape', '' + cont);
};


snip.fixedHint = function(num, optNumText, optNumHint, opt){
    optNumText = optNumText||{};
    optNumText.mixed = true;
    optNumText.toNum = true;
    optNumText.uFixed = 1;

    optNumHint = optNumHint||{};
    optNumHint.mixed = true;
    optNumHint.toNum = true;
    optNumHint.fixStages = true;
    optNumHint.uFixed = 3;

    opt = opt||{};
    opt.formatFunc = opt.formatFunc||utils.formatNum;

    return snip.orientationCont(opt.formatFunc(num, optNumText), opt.formatFunc(num, optNumHint));
};