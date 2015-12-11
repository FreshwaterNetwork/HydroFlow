define(
	[
	"jquery",
	"use!underscore",
    "dojo/text!./Templates.html",
    "dojo/text!./config.json",
     "dojo/_base/lang",
     "./FlowAppUtil"        
   

    ],
    function ($, _, templates, config, lang, Util) {

        var configVals = null;
        var container = null;
        var containerLegend = null;
        var templates = null;
        var map = null;

        var FlowApp = function (options) {
            container = options.context.container;
            legendContainer = options.context.legendContainer;
            map = options.context.map;
            templates = options.templates;
            configVals = options.config;


            this.activate = function () {

                Util.setReferences(container,legendContainer, templates, configVals, map);

                Util.setDefaultView();

            }

            this.deactivate = function () {
                Util.clearMap();
                Util.clearStreams();
            }


        }
        
            return FlowApp;

        

    }

    )


