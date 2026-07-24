// ==UserScript==
// @name         [LSS] Gebäudeumbenennung Ruckzuck
// @namespace    https://github.com/Haijo18/Leitstellenspiel-Skripte
// @version      1.0.1
// @description  Dieses Skript ermöglicht das einfache Umbenennen von Gebäuden direkt über die Gebäudeübersicht der Leitstelle.
// @author       Haijo18
// @match        https://www.leitstellenspiel.de/buildings/*
// @icon
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function injectEditButtons() {

        //Wiederholt testen, ob Tabelle geladen ist
        const interval = setInterval(() => {

            const buildingTable = document.querySelector("#building_table");

            if (buildingTable) {
                clearInterval(interval);
                const tableRows = buildingTable.querySelectorAll("tr.alliance_buildings_table_searchable");
                console.log(tableRows);

                for (let row of tableRows) {
                    const buildingLink = row.querySelector("a");

                    const button = document.createElement("a");

                    button.classList.add("btn", "btn-default", "btn-xs", "pull-left");
                    button.style.marginRight = "5px";

                    button.insertAdjacentHTML("beforeend", `
                        <span title="Bearbeiten" class="glyphicon glyphicon-pencil"></span>
                    `);

                    button.addEventListener("click", () => {

                        const newName = prompt("Neuer Gebäudename:", buildingLink.text);

                        if (newName.length > 40) {
                            alert("Name zu lang! (Max. 40 Zeichen)");
                            return;
                        }

                        // Falls neuer Name eingegeben wurde: Über API updaten
                        if (newName) {

                            // Nötige Parameter suchen: ID und Personal (Soll)
                            const buildingId = buildingLink.href.split("/").pop();
                            const personalCountTargetDiv = row.querySelector("#building_personal_count_target_" + buildingId);
                            const personalCountTarget = personalCountTargetDiv ? personalCountTargetDiv.textContent.trim() : null;

                            sendPostRequest(personalCountTarget, buildingId, newName, buildingLink);
                        }

                    });

                    buildingLink.after(button);
                }

            }
        }, 200);

    }

    // POST-Anfrage zum Updaten des Gebäudenamens erstellen und senden

    function sendPostRequest(personalCountTarget, buildingId, name, buildingLink) {

        const csrfParam = document.querySelector("meta[name='csrf-param']").content;
        const csrfToken = document.querySelector("meta[name='csrf-token']").content;

        const leitstelleBuildingId = location.pathname.split("/").pop();

        console.log("Neuer Name: " + name + " hatte die ID " + buildingId + ", Personalziel " + personalCountTarget);

        const formData = new FormData();
        formData.append("utf8", "✓");
        formData.append("_method", "patch");
        formData.append(csrfParam, csrfToken);
        formData.append("building[name]", name);
        if (personalCountTarget != null) {
            formData.append("building[personal_count_target]", personalCountTarget);
        }
        formData.append("building[leitstelle_building_id]", leitstelleBuildingId);
        formData.append("commit", "Speichern");

        fetch("/buildings/" + buildingId, {
            method: "POST",
            body: formData
        }).then(response => {
            if (!response.ok) {
                alert("Umbenennung fehlgeschlagen!");
            }
            else {
                buildingLink.innerHTML = name;
            }
        });

    }

    // Navigation zum Gebäude-Reiter erkennen

    const buildingsNav = document.querySelector("#tabs").querySelector("a[href='#tab_buildings']");

    buildingsNav.addEventListener("click", () => {
        injectEditButtons();
    });




})();
