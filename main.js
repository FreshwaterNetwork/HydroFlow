// "Flow App" plugin, main module

require({
    packages: [
	{
	    name: "jquery",
	    location: "//ajax.googleapis.com/ajax/libs/jquery/1.9.0",
	    main: "jquery.min"
	},
	{
	    name: "underscore",
	    location: "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4",
	    main: "underscore-min"
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
    "./FlowAppUtil"


	],
	 function (declare, PluginBase, $,_,templates, config,FlowApp,Util) {

	     var configVals = dojo.eval(config)[0];
                      
	     return declare(PluginBase, {	        
	         
	         toolbarName: configVals.toolbarName,
	         toolbarType: "sidebar",
	         showServiceLayersInLegend:false,
	         width: configVals.dialogWidth,
	         height: configVals.dialogHeight,
	         infoGraphic:configVals.infoGraphic,

	         initialize: function (args) {
	             this.FlowApp = new FlowApp({
	                 context: args,
	                 templates: templates,
	                 config: configVals
	             });
	         },

	         activate: function () {
	             
                 if (this.FlowApp)
	                this.FlowApp.activate();

	         },

	         deactivate: function () {
	             this.FlowApp.deactivate();
	         },

	         hibernate: function () {
	             this.FlowApp.deactivate();
	         }
	     

	     });
	 }
 );
