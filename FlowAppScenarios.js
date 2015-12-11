require({
    packages: [
	{
	    name: "jquery",
	    location: "//ajax.googleapis.com/ajax/libs/jquery/1.9.0",
	    main: "jquery.min"
	}
    ]
});

define([
    "jquery",
    "dojo/text!./metrics.json"

], function ($, metrics) {

    var metricConfig = dojo.eval(metrics)[0];
    var waitDialog;

    return {

        
        loadScenarioMetrics: function (singleMetrics, target,catchmentID) {
            //singleMetrics is the results of the service call
            //target is the source tab - HUC12 or catchments
            //catchmentID only comes in for catchments

            var resultsTable = "tblScenarios";
            if (target == "catchments")
                resultsTable = "tblCatchmentScenarios";

            $("#" +resultsTable+" td").css("font-size", "10px");
            $("#" +resultsTable +" th").css("font-size", "10px");

            $.each(singleMetrics, function () {
                switch (this.scenario_type_name) {
                    case metricConfig.scenarios["1"].scenarioName:
                        $("#" + resultsTable + " #td_1_" + this.metric_id).html(this.metric_value);
                        $("#" + resultsTable + " #td_1_" + this.metric_id).css("text-align", "right");
                        break;
                    case metricConfig.scenarios["2"].scenarioName:
                        $("#" + resultsTable + " #td_2_" + this.metric_id).html(this.metric_value);
                        $("#" + resultsTable + " #td_2_" + this.metric_id).css("text-align", "right");
                        break;
                    case metricConfig.scenarios["3"].scenarioName:
                        $("#" + resultsTable + " #td_3_" + this.metric_id).html(this.metric_value);
                        $("#" + resultsTable + " #td_3_" + this.metric_id).css("text-align", "right");
                        break;
                    case metricConfig.scenarios["4"].scenarioName:
                        $("#" + resultsTable + " #td_4_" + this.metric_id).html(this.metric_value);
                        $("#" + resultsTable + " #td_4_" + this.metric_id).css("text-align", "right");
                        break;
                }
            })

            //now we need to go through and calculate the percent change
            var tblMetrics = document.getElementById(resultsTable);
            for (var i = 1; i < tblMetrics.rows.length; i++) {
                var trCurrent = tblMetrics.rows[i];
                var baseline = parseFloat(trCurrent.cells[1].innerHTML);
                var scenario1 = parseFloat(trCurrent.cells[2].innerHTML);
                var scenario2 = parseFloat(trCurrent.cells[4].innerHTML);
                var scenario3 = parseFloat(trCurrent.cells[6].innerHTML);

                var lstScenarioes = [scenario1, scenario2, scenario3];
                var lstCells = [3, 5, 7];

                for (var x = 0; x < 3; x++) {
                    var change = Math.round(Math.abs(baseline - lstScenarioes[x]) * 100) / 100;
                    var percent;
                    if (baseline != 0) {
                        percent = Math.round((change / baseline) * 100);
                        trCurrent.cells[lstCells[x]].innerHTML = change.toString() + ", " + percent.toString() + "%";
                    }
                    else {
                        percent = "--";
                        trCurrent.cells[lstCells[x]].innerHTML = change.toString() + ", " + percent;
                    }
                    
                    trCurrent.cells[lstCells[x]].style.textAlign = "right";
                }



            }
            if (target == "HUC12") {
                //$("#divCurrent").css("display", "none");
                $("#divScenarios").css("display", "");
                $("#divWaitSingle").css("display", "none");
                
            }
            else {
                
                $("#divCatchmentScenarios").css("display", "");
                $("#divWaitCatchments").css("display", "none");
                $("#spanCatchmentID").html(catchmentID);
                //$("#divCurrent").css("display", "none");
            }

            //waitDialog.dialog("close");
            
           
            
        }
    }
})