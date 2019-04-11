/**
 * populate Form from JSON object data
 *
 * @param obj formEl   Form node
 * @param obj data     JSON data
 */
function populateForm(formEl, data) {
    Object.keys(data).map(function (key, index) {
        let value = data[key];
        let node_ctrl, field_tag;

        if (Array.isArray(value)) {
            node_ctrl = formEl.querySelectorAll(`[name="${key}[]"]`);
            if (node_ctrl.length > 0) {
                field_tag = node_ctrl[0].tagName;
            }
        } else {
            node_ctrl = formEl.querySelectorAll(`[name="${key}"]`);
            if (node_ctrl.length > 0) {
                field_tag = node_ctrl[0].tagName;
            }
        }
        switch (field_tag) {
            case "INPUT":
                let field_type = (node_ctrl.length >= 1) ? node_ctrl[0].getAttribute("type") : node_ctrl.getAttribute("type");
                switch (field_type) {
                    case "radio":
                        Object.keys(node_ctrl).map(function (key, index) {
                            let elemValue = node_ctrl[key].getAttribute("value");

                            if (elemValue == value) {
                                node_ctrl[key].checked = true;
                            } else {
                                node_ctrl[key].checked = false;
                            }
                        });
                        break;
                    case "checkbox":
                        if (node_ctrl.length > 1) {
                            Object.keys(node_ctrl).map(function (key, index) {
                                let elemValue = node_ctrl[key].getAttribute("value");
                                let elemValueInData;
                                let singleVal;

                                for (let i = 0; i < value.length; i++) {
                                    singleVal = value[i];
                                    if (singleVal == elemValue) {
                                        elemValueInData = singleVal;
                                    }
                                }
                                if (elemValueInData) {
                                    node_ctrl[index].checked = true;
                                } else {
                                    node_ctrl[index].checked = false;
                                }
                            });
                        } else if (node_ctrl.length == 1) {
                            if (value) {
                                node_ctrl[0].checked = true;
                            } else {
                                node_ctrl[0].checked = false;
                            }
                        }
                        break;
                    case "text":
                    case "hidden":
                    // color date datetime-local email month number range search tel time url week  behave as <input type="text"
                    default:
                        node_ctrl[0].value = value;
                        break;
                }
                break;
            case "SELECT":
                for (let i = 0, len = node_ctrl.length; i < len; i++) {
                    let opts = node_ctrl[i].options;

                    for (let j = 0, len = opts.length; j < len; j++) {
                        if (opts[j].value == value) {
                            opts[j].selected = true;
                        }
                    }
                }
                break;
            case "TEXTAREA":
                node_ctrl[0].value = value;
                break;
            default:
                break;
        }
    });
}

function isEmptyOrSpaces(str) {

    return str === null || str.match(/^ *$/) !== null;
}

function sort(p) {
    rows = th, s = ((n * p) - n);
    for (i = s; i < (s + n) && i < tr.length; i++) {
        rows += tr[i];
    }
    table.innerHTML = rows;
    document.getElementById("buttons").innerHTML = pageButtons(pageCount, p);
    document.getElementById("id" + p).setAttribute("class", "active btn btn-primary");
}


function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';

    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * 
 * @param integer n    pad with 0
 */
function pad(n){
    return n<10 ? '0'+n : n
}