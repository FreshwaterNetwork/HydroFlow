define(
    [
        "jquery",
        "./jquery.flot",
        "dojo/text!./config.json",
        "dojo/text!./metrics.json"
        
    ],
    function ($, plot,config,metrics) {        

        var FlowAppChart =
        {
            configVals: dojo.eval(config)[0],
            metricConfig:dojo.eval(metrics)[0],

            addChart: function (metricConfig) {

                var optionCount = $("#ddTimeSeriesMetrics option").size();

                //see if we are dealing navigation results
                var boolNavResults = false;
                if (document.getElementById("radMap"))
                    boolNavResults = true;
                                         
                if (!boolNavResults && optionCount > 0) //we can exit this, the chart should already be there
                    return


                if (optionCount == 0)
                {
                    //populate the drop down list
                    var timeSeriesOptions = "";

                    $.each(metricConfig.time_series, function () {
                        timeSeriesOptions += "<option value='" + this.id + "'>" + this.shortName;
                        if (this.units)
                            timeSeriesOptions += " (" + this.units + ")";

                        timeSeriesOptions += "</option>";
                    })

                    $("#ddTimeSeriesMetrics").append($(timeSeriesOptions));
                }
               
               

                //make a div for the charts 
                var chartDiv = $("#divChart");
                $(chartDiv).html(null);

                $("#ddTimeSeriesMetrics").change(FlowAppChart.getTimeSeriesData);

                var placeholder = $('<div>');
                $(placeholder).attr("id", "placeholder");
                $(placeholder).css({ "font-size": "10px", "line-height": "1.2em" });
                $(placeholder).width(350);
                $(placeholder).height(200);
                chartDiv.append(placeholder);

                var legendPlaceholder = $('<div>');
                $(legendPlaceholder).attr("id", "legendPlaceholder");
                $(legendPlaceholder).css({ "font-size": "8px", "line-height": "0.8em","padding-top":"15px","display":"" });
                $(legendPlaceholder).width(400);
                $(legendPlaceholder).height(30);
                chartDiv.append(legendPlaceholder);

                FlowAppChart.getTimeSeriesData();              

                
                
            },

            getTimeSeriesData: function () {

                $("#placeholder").html(null); //clear the existing chart
                $("#legendPlaceholder").html(null); //clear the existing chart

                var metricID = $("#ddTimeSeriesMetrics").val();

                if (!metricID)
                    return;


                var HUC12;

                if (document.getElementById("hidHUC12ID"))
                    HUC12 = $("#hidHUC12ID").val();
                 
                if (document.getElementById("ddNavResults"))
                    HUC12 = $("#ddNavResults").val();

                var promise = $.ajax({
                    type: "GET",
                    url: FlowAppChart.configVals.WaterFALLService + "GetMetric/.jsonp?metric_id=" + metricID + "&feature_id=" + HUC12,
                    dataType: 'jsonp'

                });

                promise.done(FlowAppChart.makeTimeSeriesChart);

                //failure
                promise.fail(function (xhr, status, error) {
                    alert("XHR: " + xhr.responseText + " Status: " + status + " Error: " + error);

                });
            },

            makeTimeSeriesChart: function (response) {

                //$("#placeholder").html(null); //clear the existing chart
                //$("#legendPlaceholder").html(null); //clear the existing chart

                if (response.length > 0) {
                    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                    var series1 = [];
                    var series2 = [];
                    var series3 = [];
                    var series4 = [];

                    $.each(response, function () {
                        var startDate = this.metric_start_date;
                        var strMonth = startDate.split("-")[1];
                        switch (this.scenario_type_name) {
                            case FlowAppChart.metricConfig.scenarios["1"].scenarioName:
                                series1.push([parseInt(strMonth), this.metric_value])
                                break;
                            case FlowAppChart.metricConfig.scenarios["2"].scenarioName:
                                series2.push([parseInt(strMonth), this.metric_value])
                                break;
                            case FlowAppChart.metricConfig.scenarios["3"].scenarioName:
                                series3.push([parseInt(strMonth), this.metric_value])
                                break;
                            case FlowAppChart.metricConfig.scenarios["4"].scenarioName:
                                series4.push([parseInt(strMonth), this.metric_value])
                                break;                            
                        }
                        
                    });

                    var chart = $.plot(placeholder, [                      
                        
                        { data: series2, label: FlowAppChart.metricConfig.scenarios["2"].displayName },
                        { data: series3, label: FlowAppChart.metricConfig.scenarios["3"].displayName },
                        { data: series4, label: FlowAppChart.metricConfig.scenarios["4"].displayName },
                        { data: series1, label: FlowAppChart.metricConfig.scenarios["1"].displayName }

                    ], {
                        series: {
                            lines: {
                                show: true
                            },
                            points: {
                                show: true
                            }
                        },
                        colors: ["#afd8f8","#4da74d","#cb4b4b","#edc240"],
                        grid: {
                            hoverable: false,
                            clickable: false
                        },
                        legend: {
                            container: $("#legendPlaceholder"),
                            noColumns:2

                        },
                        yaxis: {
                            //min: -1.2,
                            //max: 1.2,
                            position: "left"
                        },
                        xaxis: {
                            tickFormatter: function (val, axis) {
                                return (months[val - 1]);
                            }
                        }
                    });
                }
                else {
                    $("#placeholder").html("No Data Available for the Selected HUC 12");
                }

                $("#legendPlaceholder td").css({ "font-size": "10px" });
                $("#legendPlaceholder tr").css({ "height": "10px" });
                
            },
        }
    

    return FlowAppChart;
})