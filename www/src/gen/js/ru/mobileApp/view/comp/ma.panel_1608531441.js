utils.reOverrideMethod(Panel, 'initOptions', function __method__(){
	__method__.origin.apply(this, arguments);
    
    this.options.expanded = true;
    this.options.inactive = true;
});