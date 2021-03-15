utils.overrideMethod(ContentLoader, 'storeOldContainerCss', function __method__(loader){
	if( loader.container.css('overflow') == 'auto' || loader.container.css('overflow') == 'scroll' ){
		loader.container.css('overflow', 'hidden');
		
        if( loader.container.hasClass('wnd-cont-wrp') )
            loader.loaderContainer.css({top: loader.container.siblings('.wnd-topic-wrp').height()});
        else{
            __method__.origin.apply(this, arguments);
            
            var container = loader.container.get(0);
            
            loader.loaderContainer.css({top: container.scrollTop, left: container.scrollLeft});
        }
		
		loader.oldContainerCss = loader.oldContainerCss||{};
		
		loader.oldContainerCss.overflow = '';
	}
    else
        __method__.origin.apply(this, arguments);
});