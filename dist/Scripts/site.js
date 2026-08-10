var thumb1 = '/images/thumb1.jpg';
var thumb2 = '/images/thumb2.jpg';
var thumb3 = '/images/thumb3.jpg'; 

var css_spinner = 'fas fa-spinner fa-spin'; 
var POPUP1;
var POPUP2;

var API_URL = location.protocol + '//' + location.host + '/'; 
var spinner = "<div class='text-center spinner1'><i class='" + css_spinner + " fa-5x fa-fw'></i></div>";
var spinner_partial = "<div class='text-center spinner1'><i class='" + css_spinner + "'></i></div>";
var spinner_partial_2 = "<i class='" + css_spinner + "'></i>";
 
var _audio1 = '/assets/audio/new_request.mp3';
var _audio2 = '/assets/audio/new_request2.wav';

var _remove_icon_html = '<i class="fa-regular fa-xmark"></i>';


var SMModal;

function round(value, precision) {

    var round_value = value;
    try {

        var multiplier = Math.pow(10, precision || 0);
        round_value = Math.round(value * multiplier) / multiplier;

    } catch (e) {
        console.log(e);
    }

    return round_value;
}

function RemoveSpaces(string) {
    return string.split(' ').join('');
}


function TrimSpaces(string) {
    return $.trim(string);
}

function RemoveSpacesAndLeadingZero(string) {
     
    string = string.replace(/^0+/, '');  

    return string.split(' ').join('');
}

function ShowLoadingSpinner(obj) { 
    try {
        $('#' + obj.id).find("i").attr('class', css_spinner);
    } catch (e) {
        console.log(e);
    }
}


function ShowLoadingSpinner2(obj) {
    try {
        $(obj).attr('class', css_spinner);
    } catch (e) {
        console.log(e);
    }
}
 
function StopLoadingSpinner2(obj, className) {
    try {
        $(obj).attr('class', className);
    } catch (e) {
        console.log(e);
    }
}

var dlgProgressbar;
dlgProgressbar = {

    init: function (dlgProgress_DivId) {

        $(function () {
            $(dlgProgress_DivId).hide();
        });

        $(document).ajaxStart(function () {
            $(dlgProgress_DivId).show();
        });
        $(document).ajaxStop(function () {
            $(dlgProgress_DivId).hide();
        });
        $(document).ajaxError(function () {
            $(dlgProgress_DivId).hide();
        });

    }
};

var btnProgressbar;
btnProgressbar = {

    ShowLoading: function (btnID, removeCss) {
         
        var btn = $(btnID);
        btn.removeClass(removeCss).addClass(css_spinner);
    },
    ShowLoadingWithConfirmation: function (btnID, removeCss) {

        var retVal = confirm("Are you sure you want to Delete?");
        if (retVal === true) {
            var btn = $(btnID);
            btn.removeClass(removeCss).addClass(css_spinner);
            return true;
        }
        else {
            return false;
        }
    },
    StopLoading: function (btnID, addCss) {
        var btn = $(btnID);
        btn.removeClass(css_spinner).addClass(addCss);
    }
};


function GetDepreciatedValue(value, years) {
   // return Math.ceil(value * Math.pow(1 - 15 / 100, years));

    return value;
}

function highlightTarget(targetDiv) {

    //debugger;
    const target = document.getElementById(targetDiv);
    target.classList.remove('highlight');
    void target.offsetWidth; // Trigger reflow
    target.classList.add('highlight');
}

function GetDepreciatedValue_CMA(value, dep_year, rgType) {

    var year = parseInt(dep_year);

    var DepreciatedValue = value;

    if (rgType === null || rgType === '') {
        rgType = "PRIVATE";
    }
   if (rgType.toUpperCase() == "PRIVATE") {
        if (year == 0) {
            DepreciatedValue = value;//1st year no depreciation 
        } else if (year >= 1) {
            DepreciatedValue = value * Math.pow(0.85, year);
        }
    } else {
        if (year == 0) {
            DepreciatedValue = value;//1st year no depreciation 
        } else if (year >= 1) {
            DepreciatedValue = value * Math.pow(0.85, year);
        }
    }     

    return parseInt(DepreciatedValue);
}

function GetDepreciatedValue_CMA_ByCurrentValue(value, dep_year, rgType) {

    var year = parseInt(dep_year);

    var DepreciatedValue = 0; 

    if (rgType === null || rgType === '') {
        rgType = "PRIVATE";
    }
    if (rgType.toUpperCase() == "PRIVATE") {
        if (year == 0) {
            DepreciatedValue = value;//1st year no depreciation 
        } else if (year >= 1) {
            DepreciatedValue = value * 0.85;
        }
    } else {
        if (year == 0) {
            DepreciatedValue = value;//1st year no depreciation 
        } else if (year >= 1) {
            DepreciatedValue = value * 0.85;
        }
    }     

    return parseInt(DepreciatedValue);
}



function GetDepreciatedValue_CMA_old(value, dep_year, rgType) {

    ////debugger;

    var year = parseInt(dep_year);

    var DepreciatedValue = 0;
    if (rgType === null || rgType === '') {
        rgType = "PRIVATE";
    }
    if (rgType.toUpperCase() == "PRIVATE") {
        switch (year) {
            case 1:
                DepreciatedValue = value;
                break;
            case 2:
                DepreciatedValue = (value / 100) * 85;
                break;
            case 3:
                DepreciatedValue = (value / 100) * 72;
                break;
            case 4:
                DepreciatedValue = (value / 100) * 62;
                break;
            case 5:
                DepreciatedValue = (value / 100) * 52;
                break;
            case 6:
                DepreciatedValue = (value / 100) * 47;
                break;
            case 7:
                DepreciatedValue = (value / 100) * 42;
                break;
            case 8:
                DepreciatedValue = (value / 100) * 38;
                break;
            case 9:
                DepreciatedValue = (value / 100) * 34;
                break;
            case 10:
                DepreciatedValue = (value / 100) * 31;
                break;
            case 11:
                DepreciatedValue = (value / 100) * 28;
                break;
            case 12:
                DepreciatedValue = (value / 100) * 25;
                break;
            case 13:
                DepreciatedValue = (value / 100) * 23;
                break; 
            default:
                if (year >= 14) {
                    DepreciatedValue = (value / 100) * 20;
                }                
                break;
        }
    } else {
        switch (year) {
            case 1:
                DepreciatedValue = value;
                break;
            case 2:
                DepreciatedValue = (value / 100) * 85;
                break;
            case 3:
                DepreciatedValue = (value / 100) * 72;
                break;
            case 4:
                DepreciatedValue = (value / 100) * 62;
                break;
            case 5:
                DepreciatedValue = (value / 100) * 52;
                break;
            case 6:
                DepreciatedValue = (value / 100) * 45;
                break;
            case 7:
                DepreciatedValue = (value / 100) * 38;
                break;
            case 8:
                DepreciatedValue = (value / 100) * 32;
                break;
            case 9:
                DepreciatedValue = (value / 100) * 27;
                break; 
            default:
                if (year >= 10) {
                    DepreciatedValue = (value / 100) * 20;
                }
                break;
        }
    }
    return parseInt(DepreciatedValue);
}

function GetDepreciatedValue_CMA_ByCurrentValue_old(value, dep_year, rgType) {
     
    var year = parseInt(dep_year);

    var DepreciatedValue = 0;
    var DepreciatedPercent_balance = 0;
    var DepreciatedPercent_balance_prev = 0; 
    if (rgType === null || rgType === '') {
        rgType = "PRIVATE";
    }
    if (rgType.toUpperCase() == "PRIVATE") {
        switch (year) {
            case 1: 
                DepreciatedPercent_balance = 100;
                DepreciatedPercent_balance_prev = 100;
                break;
            case 2:
                DepreciatedPercent_balance = 85;
                DepreciatedPercent_balance_prev = 100;
                break;
            case 3: 
                DepreciatedPercent_balance = 72;
                DepreciatedPercent_balance_prev = 85;
                break;
            case 4: 
                DepreciatedPercent_balance = 62;
                DepreciatedPercent_balance_prev = 72;
                break;
            case 5: 
                DepreciatedPercent_balance = 52;
                DepreciatedPercent_balance_prev = 62;
                break;
            case 6: 
                DepreciatedPercent_balance = 47;
                DepreciatedPercent_balance_prev = 52;
                break;
            case 7: 
                DepreciatedPercent_balance = 42;
                DepreciatedPercent_balance_prev = 47;
                break;
            case 8: 
                DepreciatedPercent_balance = 38;
                DepreciatedPercent_balance_prev = 42;
                break;
            case 9: 
                DepreciatedPercent_balance = 34;
                DepreciatedPercent_balance_prev = 38;
                break;
            case 10: 
                DepreciatedPercent_balance = 31;
                DepreciatedPercent_balance_prev = 34;
                break;
            case 11: 
                DepreciatedPercent_balance = 28;
                DepreciatedPercent_balance_prev = 31;
                break;
            case 12: 
                DepreciatedPercent_balance = 25;
                DepreciatedPercent_balance_prev = 28;
                break;
            case 13: 
                DepreciatedPercent_balance = 23;
                DepreciatedPercent_balance_prev = 25;
                break;
            default:
                if (year >= 14) { 
                    DepreciatedPercent_balance = 20;
                    DepreciatedPercent_balance_prev = 23;
                }
                break;
        }
    } else {
        switch (year) {
            case 1: 
                DepreciatedPercent_balance = 100;
                DepreciatedPercent_balance_prev = 100;
                break;
            case 2: 
                DepreciatedPercent_balance = 85;
                DepreciatedPercent_balance_prev = 100;
                break;
            case 3: 
                DepreciatedPercent_balance = 72;
                DepreciatedPercent_balance_prev = 85;
                break;
            case 4: 
                DepreciatedPercent_balance = 62;
                DepreciatedPercent_balance_prev = 72;
                break;
            case 5: 
                DepreciatedPercent_balance = 52;
                DepreciatedPercent_balance_prev = 62;
                break;
            case 6: 
                DepreciatedPercent_balance = 45;
                DepreciatedPercent_balance_prev = 52;
                break;
            case 7: 
                DepreciatedPercent_balance = 38;
                DepreciatedPercent_balance_prev = 45;
                break;
            case 8: 
                DepreciatedPercent_balance = 32;
                DepreciatedPercent_balance_prev = 38;
                break;
            case 9: 
                DepreciatedPercent_balance = 27;
                DepreciatedPercent_balance_prev = 32;
                break;
            default:
                if (year >= 10) { 
                    DepreciatedPercent_balance = 23;
                    DepreciatedPercent_balance_prev = 27;
                }
                break;
        }

 
    }

    if (vehicle_value_purchased == 0) {
        //NO DEPRECIATION
        DepreciatedValue = parseInt(value);
    }
    else {


      //  DepreciatedValue = parseInt(parseInt(value) - (parseInt(value) / 100) * DepreciatedPercent);
         
        var vehicle_value_purchased = (value / DepreciatedPercent_balance_prev) * 100;
        DepreciatedValue = GetDepreciatedValue_CMA(vehicle_value_purchased, dep_year, rgType);

    }


    return parseInt(DepreciatedValue);
}



function isEmpty(val) {

    return (val === undefined || val === null || val.length <= 0) ? true : false;
}
 
function NotEmpty(val) {
    return (val === undefined || val === null || val.length <= 0) ? false : true;
}

function IsUndefinedOrNull(val) {

    return (val === undefined || val === null) ? true : false;
}

function stringToBoolean(string) {
    switch (string.toLowerCase().trim()) {
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": case null: return false;
        default: return Boolean(string);
    }
}

function ReloadLocation() {

    location.href = location.href;
}

function RedirectLocation(location) {
    try {
        window.location.replace(location);

        //// Sets the new location of the current window.
        //window.location = "https://www.example.com";

        //// Sets the new href (URL) for the current window.
        //window.location.href = "https://www.example.com";

        //// Assigns a new URL to the current window.
        //window.location.assign("https://www.example.com");

        //// Replaces the location of the current window with the new one.
        //window.location.replace("https://www.example.com");

        //// Sets the location of the current window itself.
        //self.location = "https://www.example.com";

        //// Sets the location of the topmost window of the current window.
        //top.location = "https://www.example.com";

    } catch (e) {
        console.log(e.message);
    }
}

function openInNewTab(href) {
    Object.assign(document.createElement('a'), {
        target: '_blank',
        href,
    }).click();
}

function openInSameTab(href) {
    Object.assign(document.createElement('a'), {
        target: '_self',
        href,
    }).click();
}


function FormOutlineLable(ctlId) {
     
    var val = $(ctlId).val(); 
    if (isEmpty(val)) {
        $(ctlId).removeClass('active');
    } else {
        $(ctlId).removeClass('active').addClass('active');
    }
}

function BindFormOutlineLable() {
     
    $('.x-mdbInput').each(function () {
        //if statement here 
        // use $(this) to reference the current div in the loop
        //you can try something like...


        FormOutlineLable('#' + this.id);


    });
}

//Decoding HTML Entities with the DOMParser.parseFromString() 
function decodeHTMLEntity(str) {

    let txt = new DOMParser().parseFromString(str, "text/html");

    return txt.documentElement.textContent;

}



function containsKey(keyValue, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i].key === keyValue) {
            return true;
        }
    }
    return false;
}




function StackedModal() {
     
    var elements = Array.prototype.slice.call(document.querySelectorAll("[data-bs-stacked-modal]"));

    if (elements && elements.length > 0) {
        elements.forEach((element) => {
            if (element.getAttribute("data-kt-initialized") === "1") {
                return;
            }

            element.setAttribute("data-kt-initialized", "1");

            element.addEventListener("click", function (e) {
                e.preventDefault();

                //debugger;

                const modalEl = document.querySelector(this.getAttribute("data-bs-stacked-modal"));

                if (modalEl) {
                     
                    var modal = $('#' + modalEl.id);

                    modal.find('.modal-content').empty();//OPTIONAL - make sure while loading modal will clear previous rendered html inside the modal body

                    // note that this will replace the content of modal-content everytime the modal is opened
                    modal.find('.modal-content').load(e.currentTarget.href);
                    
                }
            });
        });
    }
}


$(function () {


    BindFormOutlineLable();


     









 

    $(".select-control").change(function () {
        var ctlId = '#' + this.id;
        FormOutlineLable(ctlId);
    });

    bindPopover(); 



    // boostrap 4 load modal example from docs
    $('.modal_bs5').on('show.bs.modal', function (event) {

        var button = $(event.relatedTarget); // Button that triggered the modal
        var url = button.attr("href");

        if (url) {
            var modal = $('#' + event.target.id);

            modal.find('.modal-content').empty();//OPTIONAL - make sure while loading modal will clear previous rendered html inside the modal body

            // note that this will replace the content of modal-content everytime the modal is opened
            modal.find('.modal-content').load(url);
        }
    });




    // boostrap 4 load modal example from docs
    $('.modelX').on('show.bs.modal', function (event) {


        var button = $(event.relatedTarget); // Button that triggered the modal
        var url = button.attr("href");
       
        

        if (url) {
            var modal = $('#' + event.target.id);

            modal.find('.modal-content').empty();//OPTIONAL - make sure while loading modal will clear previous rendered html inside the modal body

            // note that this will replace the content of modal-content everytime the modal is opened
            modal.find('.modal-content').load(url);

            SMModal = modal;
             
        } 


     

    });




    //$('.modelX').on('shown.bs.modal', function () {
      
    //})





    $('.modelX').on('hidden.bs.modal', function () {




        //// remove the bs.modal data attribute from it
        $(this).removeData('bs.modal');


        // and empty the modal-content element
        $('.modelX').closest('.modal-content').empty().parent().removeClass('modal_bottom'); 

        //Remove class
        $(this).removeClass('modal_bottom'); 



        //// remove the bs.modal data attribute from it
        //$(this).removeData('bs.modal');

        //// and empty the modal-content element
        //$('.modelX .modal-content').empty();
    });


    //$('[data-toggle="popover"]').popover({
    //    html: true
    //});

 


    $('.accrodian-box .question-text').click(function () {
        $(this).parent().toggleClass('active');
        $(this).next('.answer-text').slideToggle();
    });

    $('.accrodian-box .question-text-1 .question-title').click(function () {
        console.log(this);
        $(this).parent().parent().toggleClass('active');
        $(this).parent().next('.answer-text').slideToggle();
    });

    $('.accordian-box-title .arrow').click(function () {
        $(this).parents().eq(2).next('.accordian-box-data').slideToggle('fast');
        $(this).toggleClass('expanded');
    });




    $('.modelX').on('shown.bs.modal', function () { 
        loadMDB();
    });


});

function loadMDB() {
    $.getScript('/assets/js/mdb.min.js', function (jd) {

        //$("a").click(function (event) { 
        //});
         
    });
}

const ModalSize = {
    Small: 'modal-sm',
    Medium: 'modal-md',
    Large: 'modal-lg',
    ExtraLarge: 'modal-xl'
};



function CloseDlg(modal_name) {


   
    try {

     
        $(modal_name).find('.close').trigger('click');

    } catch (e) {
        console.log(e);
    }

    //try {
    //    $(modal_name).modal("toggle");
    //} catch (e) {

    //}



   // $(".modal-backdrop").remove();

    ////console.log(modal_name);
    //try {



    //    $(modal_name).modal("hide");
    //    //$(modal_name).modal().toggle();
    //    //$('.modal-backdrop').hide();
    //    //$(modal_name).modal("toggle");
    //} catch (e) {
    //    console.log(e);
    //}

    ////try {
    ////    $(modal_name).modal().hide();
    ////    $('.modal-backdrop').hide();
    ////} catch (e) {
    ////    //console.log(e);
    ////}

    ////try {
    ////    $(modal_name).modal("toggle");
    ////} catch (e) {
    ////    //console.log(e);
    ////}


}


function HideModal(modal_name) {
    $(modal_name).modal('hide');
}


$(document).ready(function () {
    $('body').on('hidden.bs.modal', '.modal', function () {     

      //  debugger;

        var clearOnHide = false;
         
        try {
            var data_clearonhide = $('#' + this.id).data("clearonhide");

            if (data_clearonhide == false || data_clearonhide == 'false') {
                //do not hide
            } else {
                $('#' + this.id).find('.modal-dialog .modal-content').empty();
            }

        } catch (e) {
            console.log(e);
        } 
    });






});


var REMOTE_MODAL1 = function (modelUrl, modalSize, modalName) {

    //modal-sm
    //modal-md
    //modal-lg

    try {

        try {
            if (typeof modalName === 'undefined' || modalName === '') {
                modalName = '#modal1';
            }
        }
        catch (e1) {
            if (window.console && window.console.log) { console.log(e1.message); }
        }

        try {
            if (typeof modalSize === 'undefined' || modalSize === '') {
                modalSize = 'modal-md';
            }
        }
        catch (e) {
            if (window.console && window.console.log) { console.log(e.message); }
        }



        window.POPUP1 = $(modalName);
        var POPUP1Modal = window.POPUP1.find('.modal-dialog').addClass(modalSize);
        POPUP1Modal = POPUP1Modal.find('.modal-content');
        POPUP1Modal.empty();
        POPUP1Modal.html(spinner);
        POPUP1Modal.load(modelUrl);

        window.POPUP1.modal("show");

        return false;

    } catch (ex) {
        if (window.console && window.console.log) { console.log(ex.message); }
    }

    return false;
};



var notify;
function notify_info(Title) { notify = $.notify({ title: Title, message: "" }, { type: 'info', z_index: 10195 }); }
function notify_success(Title) { notify = $.notify({ title: Title, message: "" }, { type: 'success', z_index: 10195 }); }
function notify_warning(Title) { notify = $.notify({ title: Title, message: "" }, { type: 'warning', z_index: 10195 }); }
function notify_danger(Title) { notify = $.notify({ title: Title, message: "" }, { type: 'danger', z_index: 10195 }); }

function notify_success(Title, Msg) { if (typeof Msg === 'undefined') { Msg = ''; } notify = $.notify({ title: Title, message: Msg }, { type: 'success', z_index: 10195 }); }
function notify_info(Title, Msg) { if (typeof Msg === 'undefined') { Msg = ''; } notify = $.notify({ title: Title, message: Msg }, { type: 'info', z_index: 10195 }); }
function notify_danger(Title, Msg) { if (typeof Msg === 'undefined') { Msg = ''; } notify = $.notify({ title: Title, message: Msg }, { type: 'danger', z_index: 10195 }); }


function notify_msg(Msg, Msgtype) {

    //debugger;

    notify = $.notify({ title: '', message: Msg }, { type: Msgtype, z_index: 10195 });
}

function notify_close() {
    if (notify)
        notify.close();
}



var tblSelectAble;
tblSelectAble = {

    init: function () {

        $(".tblSelectAble tbody tr").click(function () {
            $(this).addClass('selected').siblings().removeClass('selected');
        });

    }
};


var lstSelectable;
lstSelectable = {

    init: function () {

        $(".lstSelectAble .row").click(function () {
            $(this).addClass('selected').siblings().removeClass('selected');
        });

    }
     
};




var lstSelectable_chatList;
lstSelectable_chatList = {

    init: function () {

        $(".chat-list .chat-list-item").click(function () {
            $(this).addClass('selected').siblings().removeClass('selected');
        });

    }
};


// Setup the "Up" links
function MoveRowUp(obj, post_url) { 
    var row = $(obj).closest("tr");

    // Get the previous element in the DOM
    var previous = row.prev();

    // Check to see if it is a row
    if (previous.is("tr")) {

        var isSwaped = Swap(row.attr("id"), previous.attr("id"), post_url);

        if (isSwaped === true) {

            // Move row above previous
            row.detach();
            previous.before(row);

            //Arange serrial no of gird/rows
            var SerNo_row = row.find('.sno span').html();
            var SerNo_previous = previous.find('.sno span').html();
            row.find('.sno span').html(SerNo_previous);
            previous.find('.sno span').html(SerNo_row);

            // draw the user's attention to it
            row.fadeOut();
            row.fadeIn();
        }
    }
    // else - already at the top
}

// Setup the "Up" links
function MoveRowDown(obj, post_url) {
    var row = $(obj).closest("tr");

    // Get the previous element in the DOM
    var next = row.next();

    // Check to see if it is a row
    if (next.is("tr")) {

        var isSwaped = Swap(row.attr("id"), next.attr("id"), post_url);

        if (isSwaped === true) {

            // Move row above previous
            row.detach();
            next.after(row);

            //Arange serrial no of gird/rows
            var SerNo_row = row.find('.sno span').html();
            var SerNo_next = next.find('.sno span').html();
            row.find('.sno span').html(SerNo_next);
            next.find('.sno span').html(SerNo_row);

            // draw the user's attention to it
            row.fadeOut();
            row.fadeIn();
        }
    }
    // else - already at the bottom
}

function Swap(SwappingId, SwapToId, post_url) {
    var bool = false;

    try {

        $.ajax({
            url: post_url,
            type: 'post',
            data: { id1: SwappingId, id2: SwapToId },
            async: false,
            success: function (message) {

                if (message.success) {
                    bool = true;
                }
                else {
                    var lslErrs = "<br>";
                    if (message.errors) {
                        for (var i = 0; i < message.errors.length; i++) {
                            lslErrs = lslErrs + (i + 1).toString() + ". " + message.errors[i] + "<br>";
                        }
                    }
                    notify_danger(message.responseText.toString(), lslErrs);

                    bool = false;
                }
            },
            error: function (error) {
                console.log(error);
                notify_danger("Error: " + error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }

    return bool;
}



var ddl_helpers =
{
    buildDropdown: function (result, textField, valueField, dropdown, defaultMessage,defaultValue) {
        // Remove current options
        dropdown.html('');
        // Add the empty option with the empty message
        if (defaultMessage) dropdown.append('<option value="' + defaultValue+'">' + defaultMessage + '</option>');
        // Check result isnt empty
        if (result) {
            // Loop through each of the results and append the option to the dropdown
            $.each(result, function (key, obj) {
                dropdown.append(new Option(obj[textField], obj[valueField], false, false));
            });
        }
    }
};


function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}
 
function GetCitiesAndTownLocations(langCode) {
    var lst;
    var _url = API_URL + 'Common/GetCitiesAndTownLocations?LangCode=' + langCode;
    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            success: function (data) {
                lst = data;
                BindLocataions(lst);
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}

function BindLocataions(event_locations) {
    try {
        if (event_locations) {


            var loc_item = '';

            $.each(event_locations.cityList, function (key, objCity) {

                loc_item += '<li class="dropdown-submenu">';
                loc_item += '<a class="dropdown-item" tabindex="-1" href="#">' + objCity + '</a>';
                loc_item += '<ul class="dropdown-menu">';
                $.each(event_locations.townList, function (key, objTown) {
                    if (objCity === objTown.city) {
                        loc_item += '<li class="dropdown-item">';
                        loc_item += '<a tabindex="-1" href="#">' + objTown.town + '</a>';
                        loc_item += '</li>';
                    }
                });
                loc_item += '</ul>';
                loc_item += '</li>';

                //loc_item += '<li>';
                //loc_item += '<a href="#">' + objCity + '</a>';
                //loc_item += '</li>';
            });



            var dropdown = $("#listLocations");
            dropdown.html(loc_item);

            $('#listLocationsOuter .dropdown-menu li a').on('click', function (e) {
                e.preventDefault(); // cancel the link behaviour
                //var menu = $(this).text();
                $('#location').val($(this).text());

                $('#btnSearchEvents').click();
            });
        }
    } catch (e) {
        window.console.log(e.Message);
    }
}


function GetCityOptions(countryCode, langCode) {
    var lst;
    var _url = API_URL + 'Common/GetCityOptions?CountryCode=' + countryCode + '&LangCode=' + langCode;
    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                lst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}

function GetTownOptions(CityCode, langCode) {
    var lst;
    var _url = API_URL + 'Common/GetTownOptions?CityCode=' + CityCode + '&LangCode=' + langCode;
    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                lst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}
 

function IlikeIt(event, divCountter, _url, _token) {
    try {

        
        $.ajax({
            type: "POST",
            url: _url,
            data: {
                __RequestVerificationToken: _token,
                id: event
            },
            success: function (data) {
                if (data.isSaved) {
                    //$(divCountter).text(data.TotalLikes).slideUp('slow');

                    //var likeIcon = $(divCountter + '-icon');
                    ////debugger;

                    $(divCountter + '-icon').each(function (i, obj) {
                        if ($(obj).hasClass('fas')) {
                            $(obj).removeClass('fas').addClass('far');
                        } else if ($(obj).hasClass('far')) {
                            $(obj).removeClass('far').addClass('fas');
                        }
                    });

                    //if ($(likeIcon).hasClass('fas')) {
                    //    $(likeIcon).removeClass('fas').addClass('far');
                    //} else if ($(likeIcon).hasClass('far')) {
                    //    $(likeIcon).removeClass('far').addClass('fas');
                    //}

                    //owl-item active

                    //var divCountters = $(divCountter);
                    //var i;
                    //for (i = 0; i < divCountters.length; i++) {
                    //    $(divCountter).text(data.TotalLikes);
                    //}

                    $(divCountter).each(function (i, obj) {
                        //$(obj).text(data.TotalLikes);
                        $(obj).animate({ 'opacity': 0 }, 400, function () {
                            $(obj).text(data.totalLikes).animate({ 'opacity': 1 }, 400);
                        });
                    });


                    //$(divCountter)[0].animate({ 'opacity': 0 }, 400, function () {
                    //    $(divCountter)[0].text(data.TotalLikes).animate({ 'opacity': 1 }, 400);
                    //});

                    //$(divCountter).animate({ 'opacity': 0 }, 400, function () {
                    //    $(divCountter).text(data.TotalLikes).animate({ 'opacity': 1 }, 400);
                    //});
                }
                else {
                    window.console.log(data.message);
                }
            }
        });
    } catch (e) {
        window.console.log(e.Message);
    }
}




function get_browser_info() {
    var ua = navigator.userAgent, tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return { name: 'IE ', version: (tem[1] || '') };
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\bOPR\/(\d+)/)
        if (tem != null) { return { name: 'Opera', version: tem[1] }; }
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) { M.splice(1, 1, tem[1]); }
    return {
        name: M[0],
        version: M[1]
    };
}


function bindPopover() {
     
    //$('[data-toggle="popover"]').popover();   

    //$('[data-toggle="popover"]').popover({
    //    html: true
    //});
    try {

        $('[data-toggle="popover"]').popover({
            container: 'body',
            trigger: 'focus',
            html: true,
            content: function () {
                console.log($(this));
                var clone = $(this).attr('data-content');
                return clone;
            }
        });
    } catch (e) {
        console.log(e);
    }
}




function bindPopover_dynamic(popoverName) {
    //$('[data-toggle="popover"]').popover();   

    //$('[data-toggle="popover"]').popover({
    //    html: true
    //});
    try {
         
        $('[data-toggle="' + popoverName +'"]').popover({
            container: 'body',
            trigger: 'click',
            placement: 'auto',
            html: true, 
            content: function () { 
                 
                var element = $(this);
                var id = element.attr("data-contentid"); 
               var content = $("#" + id).clone(); 
                return content;
            }
        }).on('show.bs.popover', function () {             
           //$('[data-toggle="' + popoverName + '"]').not(this).popover('hide');

           // $("body").append("<div class='popover-overlay'></div>");

            
             

            $(this).closest('.insurance-details-box').addClass('z-index-99');
            $("body").append("<div class='popover-overlay'></div>");


        }).on('hide.bs.popover', function () {
            //// Move the content back to the containing div before it gets destroyed
            //$("#popoverContentContainer").append($("#popoverContent"));

            $(".popover-overlay").remove();
            $(this).closest('.insurance-details-box').removeClass('z-index-99');
        });


    } catch (e) {
        console.log(e);
    }
}


function wheretoplace() {
    var myLeft = $(this).offset.left;

    if (myLeft < 500) return 'left';
    return 'right';
}


function bindPopover_PreventClose_InslideClick() {
    if (!$(e.target).closest('.popover').length) {
        $('.popover').each(function () {
            $(this).closest('div.popover').popover('hide');
        });
    }
}

function popupwindowAtCenter(url, title, w, h) {
    var left = (screen.width / 2) - (w / 2);
    var top = (screen.height / 2) - (h / 2);
    return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
}

$(document).ready(function () {



    //$('.popover-body').on("click", "a", function () {
    //    alert('it works!');
    //});
});



function SelectStep(stepNo) {
    try {

        var step_ward = $('#wizard-progress .step-indicator');

        $(step_ward).find('li').removeClass('active').removeClass('complete');
        $(step_ward).find('#' + stepNo).prevAll().addClass('complete');
        $(step_ward).find('#' + stepNo).addClass('active');

    } catch (e) {
        console.log(e);
    }
}


function GetCategoriesOptions(categoryMasterID, langCode) {
    var lst;
    var _url = API_URL + 'api/Common/GetCategories?CategoryMasterID=' + categoryMasterID + '&LangCode=' + langCode;
     
    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                lst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}


function GetServicesOptions(serviceID, langCode) {
   
    var lst;
    var _url = API_URL + 'api/Common/GetServices?ServiceID=' + serviceID + '&LangCode=' + langCode;
    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                lst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}



function GetServicesNotCustomForm(serviceID, langCode) {
 
    var serviceLst;
    var _url = API_URL + 'api/Common/GetServicesNotCustomForm?ServiceID=' + serviceID + '&LangCode=' + langCode;
    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                serviceLst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return serviceLst;
}

function GetServicesNotCustomFormByProvider(serviceID, langCode, providerId) {



    var serviceLst;
    var _url = API_URL + 'api/Common/GetServicesNotCustomForm_ByProvider?ServiceID=' + serviceID + '&LangCode=' + langCode + '&providerId=' + providerId
    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                serviceLst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return serviceLst;
}




function GetQueryData(tbl, f1, f2, ff1, ffv1, opr, fltrLang, langCode) {
    var lst;
    var _url = API_URL + 'api/Common/GetQueryData?tbl=' + tbl + '&f1=' + f1 + '&f2=' + f2 + '&ff1=' + ff1 + '&ffv1=' + ffv1 + '&opr=' + opr + '&fltrLang=' + fltrLang + '&LangCode=' + langCode;
    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                lst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}


function GetModelListActive(makeCode, langCode) {
    var lst;
    var _url = API_URL + 'api/Insurance/GetModelListActiveByCode/?makeCode=' + makeCode + '&langCode=' + langCode;
    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                lst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}



function GetModelListActiveByMakeAndType(vehicleTypeCode,makeCode, langCode) {
    var lst;
    var _url = API_URL + 'api/Insurance/GetModelListActiveByMakeAndType/?VehicleTypeCode=' + vehicleTypeCode+'&makeCode=' + makeCode + '&langCode=' + langCode;
    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                lst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}

function GetSubModelListActive(modelCode, langCode) {
    var lst;
    var _url = API_URL + 'api/Insurance/GetSubModelListActiveByCode/?ModelCode=' + modelCode + '&langCode=' + langCode;
    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                lst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}

function GetAreaByCityOptions(cityCode, langCode) {
    var lst;
    var _url = API_URL + 'api/Common/GetAreasByCity?CityCode=' + cityCode + '&LangCode=' + langCode;

    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                lst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}

function GetHomeOwnershipCovers(OwnershipTypeID, langCode) {
    var lst;
    var _url = API_URL + 'api/Common/GetHomeOwnershipCovers?OwnershipTypeID=' + OwnershipTypeID + '&LangCode=' + langCode;

    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                lst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}

function roundN(num, n) {
    var val = num;
    try {
        val=   parseFloat(Math.round(parseFloat(num) * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n);
    } catch (e) {
        console.log(e);
    }
    return val;
}

//function isEmail(email) {
//    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
//    return regex.test(email);
//}

function isEmail(email) {
    //var pattern = new RegExp("^[_A-Za-z0-9-]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$");
    var pattern = new RegExp("^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$");
    return pattern.test(email);
}
function validateEmail($email) {
    var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    return emailReg.test($email);
}
 

var bindDropdown1;
bindDropdown1 = {

    init: function () {

        $(".fim-dropdown > label").click(function () {
             
            $(".fim-dropdown").not($(this).parent()[0]).removeClass('active');

            $(this).parent().toggleClass('active');
            return false;
        });

        $(document).click(function (e) {
            that = e.target;
            if ($(that).closest(".fim-dropdown").length < 1 && !$(that).hasClass("fim-dropdown")) $(".fim-dropdown").removeClass('active');
        });


        $(window).on("load resize", function () {
            $(".fim-dropdown > .inner").each(function () {
                var src = $(this).parent().children("label");
                // Position
                var left = src.offset().left + src.outerHeight() / 2 - $(this).outerWidth() / 2;
                if (left + $(this).outerWidth() > $(window).width()) {
                    left = $(window).width() - $(this).outerWidth();
                }
                if (left < 0) left = 0;

                $(this).css({
                    left: left,
                    top: top
                });
            });
        });
    }
};



function ToggleClassName(divID, className) {
   

    if ($(divID).hasClass(className)) {
        $(divID).removeClass(className);
    } else {
        $(divID).addClass(className);
    }
     
}



function ValidateInput(ctl) {

    ////debugger;

    var isValid = false;

    try {
        if (isEmpty($(ctl).val())) {
            $(ctl).addClass('error');
            isValid = false;
        } else {
            $(ctl).removeClass('error').removeClass('input-validation-error').removeClass('invalid');
            isValid = true;
        }
    } catch (e) {
        console.log(e);
    }

    return isValid;

    //if ($(ctl).valid() === false || $(ctl).val().length <= 0) {
    //    $(ctl).addClass('error');
    //} else {
    //    $(ctl).removeClass('error');
    //}
}


function ValidateMinLength(input, minLength) {

    ////debugger;

    var isValid = false;

    try {
        if (input.value.length < minLength) {

            $(input).addClass('error');
            isValid = false;

        } else {

            $(input).removeClass('error').removeClass('input-validation-error').removeClass('invalid');
            isValid = true;

        }
    } catch (e) {
        console.log(e);
    }

    return isValid;

    //if ($(ctl).valid() === false || $(ctl).val().length <= 0) {
    //    $(ctl).addClass('error');
    //} else {
    //    $(ctl).removeClass('error');
    //}
}


function ValidateInput_Activate(ctl) {

    var isValid = false;

    try {
        if (isEmpty($(ctl).val())) {
            $(ctl).addClass('error');
            isValid = false;
        } else {
            $(ctl).removeClass('error').removeClass('input-validation-error').removeClass('invalid');
            isValid = true;
        }

        FormOutlineLable(ctl);

    } catch (e) {
        console.log(e);
    }

    return isValid;

    //if ($(ctl).valid() === false || $(ctl).val().length <= 0) {
    //    $(ctl).addClass('error');
    //} else {
    //    $(ctl).removeClass('error');
    //}
}



function ValidateInputNumber(ctl, from, to) {

    var isValid = false;

    try {
        if (isEmpty($(ctl).val())) {
            $(ctl).addClass('error');
            isValid = false;
        } else {

            var val = parseFloat($(ctl).val());

            if (val >= from && val <= to) {
                $(ctl).removeClass('error');
                isValid = true;
            } else {
                $(ctl).addClass('error');
                isValid = false;
            }
        }
    } catch (e) {
        console.log(e);
    }

    return isValid;
     
}

function OnlyEngChars(event, msg) {

    //console.log(event);

    // Disallow anything not matching the regex pattern (A to Z uppercase, a to z lowercase and white space)
    // For more on JavaScript Regular Expressions, 
    // var englishAlphabetAndWhiteSpace = /[A-Za-z ]/g;
    //var englishAlphabetAndDigits = /[A-Za-z0-9 ]/g;
    var englishAlphabetDigitsAndWhiteSpace = /[A-Za-z0-9 ]/g;

    // Retrieving the key from the char code passed in event.which
    // For more info on even.which, look here:  
    var key = String.fromCharCode(event.which);

    //console.log(englishAlphabetAndWhiteSpace.test(key));
    //alert(event.keyCode);

    // For the keyCodes, look here:  
    // keyCode == 8  is backspace
    // keyCode == 37 is left arrow
    // keyCode == 39 is right arrow
    // englishAlphabetAndWhiteSpace.test(key) does the matching, that is, test the key just typed against the regex pattern
    //if (event.keyCode == 8 || event.keyCode == 37 || event.keyCode == 39 || englishAlphabetAndWhiteSpace.test(key)) {
    if (event.keyCode == 8 || event.keyCode == 37 || event.keyCode == 39 || englishAlphabetDigitsAndWhiteSpace.test(key)===true) {
        return true;
    }
    else {
        // If we got this far, just return false because a disallowed key was typed. 
        alert(msg);
        return false;
    }


}


function ValidateInputEmail(ctl) {

    if ($(ctl).val().length > 0) {

        $(ctl).val($.trim($(ctl).val().replace(" ", "")));

        if (isEmail($(ctl).val()) === false) {
            $(ctl).addClass('error');
        } else {
            $(ctl).removeClass('error');
        }

    } else {
        $(ctl).addClass('error');
    }
}







var Copy_Clipboard;
Copy_Clipboard = {

    init: function () {

        var clipboard = new ClipboardJS('.btn-copy');


        clipboard.on('success', function (e) { 
            try {

               /* //debugger;*/

                e.clearSelection();
                setTooltip(e.trigger, 'Copied!');
                hideTooltip(e.trigger);
            } catch (ex) {
                hideTooltip(e.trigger);
                console.log(ex);
            }
        });

        clipboard.on('error', function (e) { 
            try {
                setTooltip(e.trigger, 'Failed!');
                hideTooltip(e.trigger);
            } catch (ex) {
                console.log(ex);
            }
        });
         
        $('.btn-copy').tooltip({
            trigger: 'click',
            placement: 'bottom'
        });

    }

};


function setTooltip(btn, message) {
      
    try {
        $(btn).tooltip('hide')
            .attr('data-original-title', message)
            .tooltip('show');
    } catch (e) { 
        console.log(e);
    }
}

function hideTooltip(btn) {

    try {

        setTimeout(function () {
            $(btn).tooltip('hide');
        }, 1000);
    } catch (e) {
        console.log(e);
    }
}








function autocomplete(inp, arr) {
     

    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function (e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function (e) {
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        } 
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {  
        closeAllLists(e.target);
    });
    document.addEventListener("focusout", function (e) {
        closeAllLists(e.target); 
    });
}




function display_text_error(ctl, msg) {
    $(ctl).html('<span class="text-danger">' + msg + '</span>');
}

function display_text_success(ctl, msg) {
    $(ctl).html('<span class="text-success">' + msg + '</span>');
}

function display_text_info(ctl, msg) {
    $(ctl).html('<span class="text-info">' + msg + '</span>');
}

function display_text_warning(ctl, msg) {
    $(ctl).html('<span class="text-warning">' + msg + '</span>');
}


function ToggleDarkMode(obj) {
    try {

        var darmode_name = 'darkmode';
        //var obj_id = '#innerBody';
        var obj_id = 'body';


        if ($(obj).prop('checked')) {
            $(obj_id).removeClass('darkmode').addClass('lightmode');
            localStorage.setItem("theme", 'lightmode');
        } else {
            $(obj_id).removeClass('lightmode').addClass('darkmode');
            localStorage.setItem("theme", 'darkmode');
        }
    } catch (e) {
        console.log(e);
    }
}

function getThemeMode() {

    var themeName = localStorage.getItem("theme");
    if (themeName == null || themeName ==='') {
        themeName = 'lightmode';
    }


    return themeName;
}



function BindChatBoxEvents() {
 


    document.getElementById("chatbot_toggle").onclick = function () {
         
        if (document.getElementById("chatbot").classList.contains("collapsed")) {
            document.getElementById("chatbot").classList.remove("collapsed")
            document.getElementById("chatbot_toggle").children[0].style.display = "none"
            document.getElementById("chatbot_toggle").children[1].style.display = ""

            document.getElementById("CB_MessageContent").focus(); 
            
        }
        else {
            document.getElementById("chatbot").classList.add("collapsed")
            document.getElementById("chatbot_toggle").children[0].style.display = ""
            document.getElementById("chatbot_toggle").children[1].style.display = "none"
        }
    }


}


function create_UUID() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function parseJsonDate(jsonDateString, format) {
    if (format) {

    }
    else {
        format = "DD/MM/YYYY";
    }
    return moment(jsonDateString).format(format).toUpperCase();
}


//Comparer Function
function GetSortOrder(prop) {
    return function (a, b) {
        if (a[prop] > b[prop]) {
            return 1;
        } else if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    }
}



function OpenAndCloseChantWindow(cb_entityType, cb_refID, cb_chatTitle, cb_direction, cb_createdByName) {
    try {

        
        $('#chatbot_outer').remove(); //Remove if already added to body

        var divChatBot_outer = 'body';
        var divChatBot = '#chatbot'; 
        $.get('/Message/_ChatBot', { entityCode: cb_entityType, refId: cb_refID, chatTitle: cb_chatTitle, direction: cb_direction, createdByName: cb_createdByName }, function (data) {
            $(divChatBot_outer).append(data);
            BindChatBoxEvents();
            $("#chatbot_toggle").click(); //open window

          
        }).fail(function (jqxhr, settings, ex) { console.log(ex); });
    } catch (e) {
        notify_danger("Error: " + e.message);
    }

    return false;
}


function InputAllowOnlyEnglish(ctlId, msg) {
     

    $(ctlId).on("keypress", function (event) {
         

        // Disallow anything not matching the regex pattern (A to Z uppercase, a to z lowercase and white space) 
        var englishAlphabetAndWhiteSpace = /[A-Za-z ]/g;
         
        var key = String.fromCharCode(event.which);

        //alert(event.keyCode);
         
        // keyCode == 8  is backspace
        // keyCode == 37 is left arrow
        // keyCode == 39 is right arrow
        // englishAlphabetAndWhiteSpace.test(key) does the matching, that is, test the key just typed against the regex pattern
        if (event.keyCode == 8 || event.keyCode == 37 || event.keyCode == 39 || englishAlphabetAndWhiteSpace.test(key)) {
            return true;
        }

        alert(msg)

        // If we got this far, just return false because a disallowed key was typed.
        return false;
    });



    $(ctlId).on("paste", function (e) {
        e.preventDefault();
    });

}


function closeFeatureOptions_popover() {
    $('.popover-item').removeClass('selected-feature');
}



function SetRequestDisplayStatus(requestID, referenceNo, displayStatus) {

    try {

        if (requestID > 0) {
            var objReq = new Object();
            objReq.RequestID = requestID;
            objReq.ReferenceNo = referenceNo;
            objReq.DisplayStatus = displayStatus;

            $.ajax({
                type: 'POST',
                url: '/Insurance/_update_request_display_status',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(objReq),
                beforeSend: function () {

                },
                success: function (xhr_res) {

                    //console.log(xhr_res);

                    if (xhr_res.StatusCode == 'OK') {
                        console.log('Request display status updated sccussfully');
                    }
                    else {
                        notify_warning(xhr_res);
                        console.log('Error while updating request display status');
                        console.log(xhr_res);
                    }
                },
                complete: function () {

                },
                error: function (err) {

                    console.log(err);
                }
            });
        }
        

    } catch (e) {
        console.log(e);
    }

}


function GetHomeOffers(CountryCode, ContactNo, ResidenceCode, CityCode, AreaCode, PropertyTypeID, OwnershipTypeID, CoverTypeID, ValueOfContent, ValueOfProperty, ValueOfPersonalBelonging, LangCode) {

    try {

       
            var objReq = new Object();
            objReq.CountryCode = CountryCode;
            objReq.ContactNo = ContactNo;
            objReq.ResidenceCode = ResidenceCode;
            objReq.CityCode = CityCode;
            objReq.AreaCode = AreaCode;
            objReq.PropertyTypeID = PropertyTypeID;
            objReq.OwnershipTypeID = OwnershipTypeID;
            objReq.CoverTypeID = CoverTypeID;
            objReq.ValueOfContent = ValueOfContent;
            objReq.ValueOfProperty = ValueOfProperty;
            objReq.ValueOfPersonalBelonging = ValueOfPersonalBelonging;
            objReq.LangCode = LangCode;

        var response = new  Object();

            $.ajax({
                type: 'POST',
                url: API_URL + 'api/Common/GetHomeOffers',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(objReq),
                beforeSend: function () {

                },
                success: function (xhr_res) {

                    //console.log(xhr_res);

                    if (xhr_res.StatusCode == 'OK') {
                        console.log('Offers get sccussfully');
                        console.log(xhr_res);
                        loadOffers(xhr_res.ReferenceNo);

                    }
                    else {
                        notify_warning(xhr_res);
                        console.log('Error while getting home offers');
                        console.log(xhr_res);

                    }
                    
                },
                complete: function () {

                },
                error: function (err) {

                    console.log(err);
                }
            });


    } catch (e) {
        console.log(e);
    }

}

function ComponentChangeEvent() {
    try {

        //debugger;

        //HELPING NOTE
        $('#Rule_Exp_Help_Text').html('');
        if ($('#ComponentID option:selected').text() === 'Number of claims on license' || $('#ComponentID option:selected').text() === 'Number of claims on chassis') {
            $('#Rule_Exp_Help_Text').html('Y1-Y3 means ' + new Date().getFullYear() + '-' + (new Date().getFullYear()-2)+' max Y5');
        }


    } catch (e) {
        console.log(e);
    }
}




function colapse_toggle(id) {


    $(id).collapse("toggle");

     
}





function Load_CountryCode_Selector() {
    try {

        var defaultCountryCode = getCountryCodeByDialCode($("#CountryCode").val());

        if (isEmpty(defaultCountryCode)) {
            defaultCountryCode = 'OM';
        }

        var countryCodes = ['AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BV', 'BR', 'IO', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH', 'CM', 'CA', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC', 'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HM', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'MK', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR', 'QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS', 'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UM', 'UY', 'UZ', 'VU', 'VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW'];
        //var countryCodes = ['OM', 'AE', 'SA', 'QA', 'KW', 'BH'];

        

        // Initialize intlTelInput on the hidden input field
        var input = document.querySelector("#CountryCode");
        var iti = window.intlTelInput(input, {
            separateDialCode: true,
            initialCountry: defaultCountryCode,
            onlyCountries: countryCodes,
            preferredCountries: ['OM', 'AE', 'SA'],
            utilsScript: "../assets/js/utils.js"
        });

        $("#CountryCode").on("countrychange", function (e, countryData) {

            var selectedCountryData = iti.getSelectedCountryData();
            var dialCode = selectedCountryData.dialCode.replace('+', '');

            $("#CountryCode").val(dialCode);
        });


        function getCountryCodeByDialCode(dialCode) {
            
            var countryData = window.intlTelInputGlobals.getCountryData();
            var foundCountry = countryData.find(function (country) {
                return country.dialCode === dialCode;
            });
            return foundCountry ? foundCountry.iso2 : "OM"; // Default to United States if not found
        }

    } catch (e) {
        console.log(e);
    }
}








function isArabic(strInput) {
    var arregex = /[\u0600-\u06FF]/;
    if (arregex.test(strInput)) {
        return true;
    } else {
        return false;
    }
}
 
function SendOTP(mobileNo, langCode, token) {
    try {

        debugger;

        //var objReq = new Object(); 
        //objReq.MobileNo = mobileNo;
        //objReq.LangCode = langCode;
        //objReq.__RequestVerificationToken = token;


        var objReq = new FormData();
        objReq.append("MobileNo", mobileNo);
        objReq.append("LangCode", langCode);
        objReq.append("__RequestVerificationToken", token);

        var btnSendId = '#btnSendOTP';

        var btnSendHtml = $(btnSendId).html();


        $.ajax({
            type: 'POST',
            url: ("/Insurance/_SendOTP/"),
            contentType: false, // Not to set any content header
            processData: false, // Not to process data
            dataType: 'json',
            data: objReq,
            async: true,
            beforeSend: function () {

                $(btnSendId).html(spinner_partial_2);

            },
            success: function (xhr_res) {

                //console.log(xhr_res);

                if (xhr_res.StatusCode == "OK") {
                     
                    notify_success('OTP Sent successfully');

                }
                else if (xhr_res.StatusCode == "OTPLIMIT") {
                    notify_warning('OTP Limit Exceeded, Please wait for some time.');
                }
                else {
                    //console.log(xhr_res);
                    notify_warning('Error: ' + xhr_res.Message);
                }

            },
            complete: function (xhr_res) {

                $(btnSendId).html(btnSendHtml);

            },
            error: function (err) {
                notify_danger('Error' + err);

                $(btnSendId).html(btnSendHtml);
            },

        });


    } catch (e) {
        notify_warning(e.message);
        console.log(e);
        $(btnSendId).html(btnSendHtml);
    }
}

function GetProviderDetails(providerID) {
    var lst;
    var _url = API_URL + 'api/Common/GetProviderDetails?providerID=' + providerID;

    try {
        $.ajax({
            url: _url,
            type: 'GET',
            data: {},
            async: false,
            success: function (data) {
                lst = data;
            },
            error: function (error) {
                console.log(error);
            }
        });
    } catch (e) {
        console.log(e.message);
    }
    return lst;
}


 