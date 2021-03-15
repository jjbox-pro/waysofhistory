wReports.prototype.modifyCont = function(){
	this.setPlugin(IPlugin_footer, {$wrp: this.$cont});
};



bReports_view.prototype.afterShow = function(){
    this.parent.plugins.footer.$setFooter(this.parent.$footer);
};