//nsstubb.js

function addRow(tableID, data) {
	var table = document.getElementById(tableID);
 
    var rowCount = table.rows.length;
	var row = table.insertRow(0);

	var cell1 = row.insertCell(0);
	cell1.innerHTML = formatDateTime();
 
	var cell2 = row.insertCell(1);
	cell2.innerHTML = data.activity;
  
  //set the tooltip for the cell.
  cell2.title = data.activity + "?" + data.query;
 
	var cell3 = row.insertCell(2);
	var element2 = document.createElement("input");
	element2.type = "button";
	element2.name = "buttonName";
	element2.id = $('#activitynumber').text();

	if (data.code === 200) {
		element2.value = "View";
		element2.className = "activitybutton btn btn-primary pull-left"; //btn btn-success 
		element2.onclick = function(){showRoute(data.activity);};
		element2.onmouseover = function(){
			cell2.className = "selected-view-label";
		};
		element2.onmouseout = function(){
			cell2.className = "";
		};
	}else{
		element2.value = "Add";
		element2.className = "activitybutton btn btn-success pull-left"; //btn btn-success 
		element2.onclick = function(){addRoute(data.activity);};
		element2.onmouseover = function(){
			cell2.className = "selected-add-label";
		};
		element2.onmouseout = function(){
			cell2.className = "";
		};
	}


	cell3.appendChild(element2);
}

//View button is pressed in the activity view.  
function showRoute(route){
    $('#selectroute').val(route);
    toggleModifyRoute();
    viewRouteJSON();
}

//Add button is pressed in the activity view.
function addRoute(route){
    $('#newRouteInput').val(route);
    toggleAddRoute();
}

function viewRouteJSON(){
    disableAllButtons(true);
      $("#selectroute option[value='--select route--']").remove();
      var routeTag = 'route=';
        $.ajax({
          type: "GET",
          url: "/routedata",
          data: routeTag+$('#selectroute').val(),
          success: function(data){
            $('#routeResponseStatic').val(data.data); 
            setDelayToggleState(data.delay);
            $('#timeDelayField').val(data.delayms);

            setHttpMethod(data.httpMethod);

            disableAllButtons(false);
          }
        });
     return false;
}

function removeAllStylesOnHttpMethod(){
  $('#httpmethodlabel').removeClass('nsstubb-get');
  $('#httpmethodlabel').removeClass('nsstubb-post');   
}

function setDelayToggleState(isOn){
    if(isOn || isOn == 'true'){
      //set the delay state of the hidden form field
      $('#hiddendelay').val(true);

      $('#delayToggleOn').addClass('active');   
      $('#delayToggleOff').removeClass('active');
    }else{
      $('#hiddendelay').val(false);
      $('#delayToggleOn').removeClass('active');   
      $('#delayToggleOff').addClass('active');  
    }
}

  function toggleDelay(delay){
      $.ajax({
      type: "POST",
      url: '/toggledelay',
      data: {"route":$("#selectroute").val(), "delay":delay, "delayms":$('#timeDelayField').val()},
      success: function(data){
        if(delay){
          $("#warningLabel").fadeIn(1000, function(){
            setTimeout(function(){
              $("#warningLabel").fadeOut(1000)}, 2000);
          });
        }   
      },
      error: function(jqXHR, textStatus, errorThrown){
        if(delay){
          bootbox.alert("Warning: Could not toggle the Delay ON.");
        }else{
          bootbox.alert("Warning: Could not toggle the Delay OFF.");
        }
      }
    });
  }

function getConfirm(callback){
    $('#deleteConfirmModal').modal({show:true,
                            backdrop:true,
                            keyboard: false,
    });

    $('#deleteConfirmModalCloseButton').click(function(){
        $('#deleteConfirmModal').modal('hide');
        if (callback) callback(false);

    });
    $('#deleteConfirmModalDeleteButton').click(function(){
        $('#deleteConfirmModal').modal('hide');
        if (callback) callback(true);
    });
}

/********************************************************************
* Button handling.
*********************************************************************/
function disableAllButtons(state){
	$('#updateSubmitButton').prop('disabled', state);
    $('#deleteSubmitButton').prop('disabled', state);
    disableDelayToggleGroup(state);
}

function disableDelayToggleGroup(state){
    $('#delayToggleOn').prop('disabled', state);  
    $('#delayToggleOff').prop('disabled', state);
    $('#timeDelayField').prop('disabled', state);
}

function toggleModifyRoute(){
	$('#modfyButton').addClass('active');
    $('#addButton').removeClass('active');
    $('#addPOSTResponse').removeClass('active');
    $('#addRoute').hide();
    $('#addSubmitButton').hide();
    $('#updateSubmitButton').show();
    $('#deleteSubmitButton').show();
    $('#modifyRoute').show();
    disableAllButtons(true);
    $("#selectroute option[value='--select route--']").remove();
    var routeTag = 'route=';
    $.ajax({
      type: "GET",
      url: "/routedata",
      data: routeTag+$('#selectroute').val(),
      success: function(data){
        console.log(data);
        $('#routeResponseStatic').val(data.data);
        setDelayToggleState(data.delay);
        $('#timeDelayField').val(data.delayms); 

        setHttpMethod(data.httpMethod);

        disableAllButtons(false);
      }
    });
     return false;
}

function setHttpMethod(httpMethod){
  if(httpMethod){
    removeAllStylesOnHttpMethod();
    if(httpMethod == 'POST'){
      $('#httpmethodlabel').addClass('nsstubb-post'); 
    }else{
      $('#httpmethodlabel').addClass('nsstubb-get');
    }            
    $('#httpmethodlabel').text(httpMethod);
    $('#httpmethodlabel').show();   
  }else{
    removeAllStylesOnHttpMethod();
    $('#httpmethodlabel').addClass('nsstubb-get');
    $('#httpmethodlabel').text('GET');
    $('#httpmethodlabel').show();
  }
}


function toggleAddRoute(){
	    disableAllButtons(false);
    $('#modfyButton').removeClass('active');
    $('#addButton').addClass('active');
    $('#addPOSTResponse').removeClass('active');
    $('#modifyRoute').hide();
    $('#deleteSubmitButton').hide();
    $('#addSubmitButton').show();
    $('#updateSubmitButton').hide();
    $('#addRoute').show();
    $('#routeResponseStatic').val('');
    setDelayToggleState(false);
    $('#timeDelayField').val(0);
    return false;
}

function toggleAddPOSTResponse(){
      disableAllButtons(false);
    $('#modfyButton').removeClass('active');
    $('#addButton').removeClass('active');
    $('#addPOSTResponse').addClass('active');
    $('#modifyRoute').hide();
    $('#deleteSubmitButton').hide();
    $('#addSubmitButton').show();
    $('#updateSubmitButton').hide();
    $('#addRoute').show();
    $('#routeResponseStatic').val('');
    setDelayToggleState(false);
    $('#timeDelayField').val(0);
    return false;  
}


/********************************************************************
* Utility Functions
*********************************************************************/
function formatDateTime(){
    var currentdate = new Date(); 
    var hour = currentdate.getHours();
    var min = currentdate.getMinutes();
    var sec = currentdate.getSeconds();

    var hourS;
    var minS;
    var secS;

    if (hour < 10){
       hourS = "0"+hour;
    }else{
       hourS = hour;
    }
    
    if (min < 10){
       minS = "0"+min;
    }else{
       minS = min;
    }
        
    if (sec < 10){
       secS = "0"+sec;
    }else{
       secS = sec;
    }

    var datetime = "" + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + hourS + ":"  
                + minS + ":" 
                + secS;

    return datetime;
}