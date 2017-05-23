// ==UserScript==
// @name         Jira pontos
// @namespace    https://github.com/seliver/
// @version      0.1
// @description  try to take over the world!
// @author       Alexey Seliverstov
// @match        https://7graus.atlassian.net/secure/RapidBoard.jspa*
// @grant        none
// @require     https://code.jquery.com/jquery-1.12.4.js
// @require     https://code.jquery.com/ui/1.12.1/jquery-ui.js
// @require     http://netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js
// ==/UserScript==

(function() {
    'use strict';

    
    function getVisibleIssues(issues, sprint) {
        var visible = [];
        issues.forEach(function(issue){
            if (issue.hidden === false && issue.statusId !== 1 && sprint.issuesIds.indexOf(issue.id) !== -1) {
                visible.push(issue);
            }
        });
        return visible;
    }

    function createWorkloadEntry(assignee, assigneeName) {
        return {
            assignee: assignee,
            assigneeName: assigneeName,
            totalEstimate: 0,
            one: 0,
            two: 0,
            three: 0,
            five: 0,
            eight: 0,
            thirteen: 0,
            totalTrackingEstimate: 0,
            issues: []
        };
    }

    function getResults(){
        var url = 'https://7graus.atlassian.net/rest/greenhopper/1.0/xboard/plan/backlog/data.json?rapidViewId=20';
        var request = new XMLHttpRequest();

        request.open('GET', url, true);

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                processResult(request);
            }
        };

        request.onerror = function() {
            // There was a connection error of some sort
        };

        request.send();
    }
    var node = document.createElement("div");
    node.id = 'points';
    node.style = "position: absolute;width: 400px;height: 400px;z-index: 1000;bottom: 100px;left: 100px;background-color: white;";
    var textnode = document.createTextNode("Loading...");
    node.appendChild(textnode);
    var html = document.querySelector('html');
    html.appendChild(node);
    setInterval(getResults, 3000);
    
    $( "#points" ).draggable();
    function processResult(request){
        var resp = JSON.parse(request.responseText);
        var visibleIssues = getVisibleIssues(resp.issues, resp.sprints[0]);
        var stats = visibleIssues.reduce(function (memo, issue) {
            var assignee = issue.assignee;
            // Create entry if necessary
            if (!memo.users[assignee]) {
                memo.users[assignee] = createWorkloadEntry(assignee, issue.assigneeName);
                memo.usersList.push(memo.users[assignee]);
            }

            // Add issue
            memo.users[assignee].issues.push(issue);
            memo.issues.push(issue);

            // Add estimate
            var estimate = issue.estimateStatistic && issue.estimateStatistic.statFieldValue && issue.estimateStatistic.statFieldValue.value;
            if (estimate) {
                if (estimate == 1){
                    memo.users[assignee].one++;
                }else if (estimate == 2){
                    memo.users[assignee].two++;
                }else if (estimate == 3){
                    memo.users[assignee].three++;
                }else if (estimate == 5){
                    memo.users[assignee].five++;
                }else if (estimate == 8){
                    memo.users[assignee].eight++;
                }else if (estimate == 13){
                    memo.users[assignee].thirteen++;
                }
                memo.users[assignee].totalEstimate += estimate;
                memo.totalEstimate += estimate;
            }

            return memo;
        }, {unassigned: createWorkloadEntry(null, null), issues: [], users: [], usersList: [], totalEstimate: 0});

        // Sort by highest estimate statistic total to lowest
        var sortedAssignedWork = _.toArray(stats.usersList).sort(function (a, b) {
            return b.totalEstimate - a.totalEstimate || a.assigneeName.localeCompare(b.assigneeName);
        });

        var html = "<table border=1 class='table table-striped'><tr><th>Nome</th><th>1</th><th>2</th><th>3</th><th>5</th><th>8</th><th>13</th><th>Total</th></tr>";
        for (let user of sortedAssignedWork) {
            if (typeof user.assigneeName !== "undefined"){
                html += "<tr>";
                html += "<td>"+user.assigneeName+"</td>";
                html += "<td>"+user.one+"</td>";
                html += "<td>"+user.two+"</td>";
                html += "<td>"+user.three+"</td>";
                html += "<td>"+user.five+"</td>";
                html += "<td>"+user.eight+"</td>";
                html += "<td>"+user.thirteen+"</td>";
                html += "<td>"+user.totalEstimate+"</td>";
                html += "</tr>";
            }
        }
        html += "</table>";
        document.querySelector('#points').innerHTML = html;
    }
})();
