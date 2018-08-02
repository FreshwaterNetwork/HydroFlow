// "Flow App" plugin, main module

require({
    packages: [
		{
		    name: "jquery",
		    location: "//ajax.googleapis.com/ajax/libs/jquery/1.9.0",
		    main: "jquery.min"
		}
	]
});

define(
	["dojo/_base/declare",
	"framework/PluginBase",
	"jquery",
	"use!underscore",
    "dojo/text!./Templates.html",
    "dojo/text!./config.json",
    "./FlowApp",
    "./FlowAppUtil",
    "dojo/dom"


	],
	 function (declare, PluginBase, $,_,templates, config, FlowApp, Util, dom) {

	     var configVals = dojo.eval(config)[0];
	     var isActive = true;
	                           
	     return declare(PluginBase, {	        
	         
	         toolbarName: configVals.toolbarName,
	         toolbarType: "sidebar",
	         showServiceLayersInLegend:false,
	         size: "custom",
	         width: "400",
	         height: configVals.dialogHeight,
	         infoGraphic:configVals.infoGraphic,

	         initialize: function (args) {
	            // Access framework parameters
				$( dom.byId(args.container) ).parent().addClass("hyfl");
	            this.FlowApp = new FlowApp({
	                 context: args,
	                 templates: templates,
	                 config: configVals
	             });
	            
	         },

	         activate: function () {
	             
	             if (isActive) {
	                 if (this.FlowApp)
	                     this.FlowApp.activate(isActive);
	             }
	            

	         },

	         deactivate: function () {
	             //this.FlowApp.deactivate();
	             isActive = false;
	         },

	         hibernate: function () {
	             isActive = true;
	            this.FlowApp.deactivate();
	            
	         }
	     

	     });
	 }
 );
