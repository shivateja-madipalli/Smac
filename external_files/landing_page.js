//landing page.js

var global_previous_room_name;
var global_current_room;
var global_current_user;

var global_current_private_room;

var socket = io();

jQuery(document).ready(function($) {

  //var socket = io();
  populate_empty_rooms_data();

  //console.log('page landed');

  $('#user_Name').keyup(function(e) {
    roomName = $('#user_Name').val();
		if($(this).val().length !=0) {
      if(event.keyCode == 13) {
        $("#select_username").click();
      }
			$('#select_username').prop( "disabled", false );
      $("#select_username").css("background-color","#607D8B");
		}
		else {
			$('#select_username').prop( "disabled", true );
      $("#select_username").css("background-color","gray");
		}
  });

  $('#select_username').on('click', function(event) {
    event.preventDefault();
    new_user_name = $('#user_Name').val();
    new_user_name = new_user_name.trim();
    if(!(jQuery.isEmptyObject(new_user_name))) {
      socket.emit('new_user', new_user_name);
    }
    // else {
      $('#select_username').prop( "disabled", true );
      $("#select_username").css("background-color","gray");
    // }
    return false;
  });

  socket.on('new_user_details', function(current_user) {
    if(!(jQuery.isEmptyObject(current_user))) {
      console.log(current_user);
      global_current_user = current_user;
      all_actions_after_creating_user(current_user);
      $("#status_selecting_user_name").html("");
    }
    else {
      // alert('User name already exists');
      $("#status_selecting_user_name").html("User name already exists");
      $('#select_username').val(null);
    }
  });

  socket.on('populate_all_user_data', function(all_Users){
    if(!(jQuery.isEmptyObject(all_Users))) {
      //console.log(all_Users);
      //show the users with whom he current user is chatting on top
      show_all_current_Users(all_Users);
    }
  });

  $('#new_room_name').keyup(function(e) {
    roomName = $('#new_room_name').val();
		if($(this).val().length !=0) {
      if(event.keyCode == 13) {
        $("#create_new_room_name").click();
      }
			$('#create_new_room_name').prop( "disabled", false );
      $("#create_new_room_name").css("background-color","#607D8B");
		}
		else {
			$('#create_new_room_name').prop( "disabled", true );
      $("#create_new_room_name").css("background-color","gray");
		}
  });

  $('#create_new_room_name').on('click', function(event){
    var newly_created_room = $('#new_room_name').val();
    newly_created_room = newly_created_room.trim();
    newly_created_room = newly_created_room.replace(/\ /g, '_');
    if(!(jQuery.isEmptyObject(newly_created_room))) {
      socket.emit('new_room', newly_created_room, global_current_user);
      $('#new_room_name').val('');
    }
    // else {
      //disable the button
      $('#create_new_room_name').prop( "disabled", true );
      $("#create_new_room_name").css("background-color","gray");
    // }
  });

  $('#roomList_select').on('change', function(e) {
    var room_Selected = $('#roomList_select').val();
		if(room_Selected !== 'NothingSelected') {
			if(jQuery.isEmptyObject(global_previous_room_name)) {
				//console.log('inside previous room empty');
        //console.log('global_current_user' + global_current_user);
        var res_obj = {
					"username" : global_current_user,
					"room_selected" : room_Selected
				}
				global_previous_room_name = room_Selected;
				global_current_room = room_Selected;

				socket.emit('user_selected_room', res_obj);
			}
			else if(!(jQuery.isEmptyObject(global_previous_room_name)) && room_Selected !== global_previous_room_name) {
				//console.log('inside previous room NOT empty');
        var res_obj = {
					"username" : global_current_user,
					"room_selected" : room_Selected
				}
				socket.emit('user_left_room', global_previous_room_name);
				global_previous_room_name = room_Selected;
				global_current_room = room_Selected;
				socket.emit('user_selected_room', res_obj);
			}
			else {
				//console.log('DAMN');
				remove_CssClassFrom_HTML_Element('chatSpace_div', 'chatDiv_DisplayTrue_css');
			}
      $('#status_creating_new_room').html("");
		}
		else {
			global_previous_room_name = null;
			global_current_room = null;
			remove_CssClassFrom_HTML_Element('chatSpace_div', 'chatDiv_DisplayTrue_css');
		}
  });

  socket.on('rooms_data_Updates', function(rooms_data, user_who_created_the_room) {
    populate_rooms_Data(rooms_data, user_who_created_the_room);
  });

  socket.on('user_joined_a_room', function(newly_joined_user) {
    //console.log('user_joined_a_room is called');
    //this will be invoked when ever a new user joins the room
    open_chat_div();
    system_message_toall_users_in_room = newly_joined_user + " has joined the room";
    html_ToBe_added = create_A_SpanToAdd_ChatMessage(null, system_message_toall_users_in_room, 'system_Messages_to_ChatRoom_css');
    addMessages_to_MainChat('room_chat_display', html_ToBe_added);
    enable_user_name_in_allUsers(newly_joined_user);
  });

  socket.on('update_rooms_count', function (all_users_count_in_current_room, room_name){
    // var user_count_inthis_room = Object.keys(all_users_in_current_room).length;
    update_rooms_select_options(room_name, all_users_count_in_current_room);
  });

  $('#chatRoom_messageInput').keyup(function(e) {
		// chatMessage = $('#chatRoom_messageInput').val();
		if($(this).val().length !=0) {
      if(event.keyCode == 13) {
        $("#chatRoom_messageInput_SendButton").click();
      }
			$('#chatRoom_messageInput_SendButton').prop( "disabled", false );
      $("#chatRoom_messageInput_SendButton").css("background-color","#607D8B");
		}
		else {
			$('#chatRoom_messageInput_SendButton').prop( "disabled", true );
      $("#chatRoom_messageInput_SendButton").css("background-color","gray");
		}
	});

	$('#chatRoom_messageInput_SendButton').on('click', function(e) {
		chat_Message = $('#chatRoom_messageInput').val();
    //console.log('exec in send text msg');
    //console.log(chatMessage);
    if(chat_Message.trim().length !=0) {
  		socket.emit('chat_Message', global_current_room, global_current_user, chat_Message, false);
      $('#chatRoom_messageInput').val('');
    }
    // else {
      $('#chatRoom_messageInput_SendButton').prop( "disabled", true );
      $("#chatRoom_messageInput_SendButton").css("background-color","gray");
    // }
	});

  $('#privateChat_messageInput').keyup(function(e) {
    chatMessage = $('#privateChat_messageInput').val();
    if($(this).val().length !=0) {
      if(event.keyCode == 13){
        $("#privateChat_messageInput_SendButton").click();
      }
      $('#privateChat_messageInput_SendButton').prop( "disabled", false );
      $("#privateChat_messageInput_SendButton").css("background-color","#607D8B");
    }
    else {
      $('#privateChat_messageInput_SendButton').prop( "disabled", true );
      $("#privateChat_messageInput_SendButton").css("background-color","gray");
    }
  });

  $('#privateChat_messageInput_SendButton').on('click', function(e) {
    private_chatMessage = $('#privateChat_messageInput').val();
    //console.log('exec in PRIVATE send text msg');
    //console.log(private_chatMessage);
    private_chatMessage = private_chatMessage.trim();
    if(private_chatMessage.length !=0) {
  		socket.emit('chat_Message', global_current_private_room, global_current_user, private_chatMessage, true);
      $('#privateChat_messageInput').val('');
    }
    // else {
      $('#privateChat_messageInput_SendButton').prop( "disabled", true );
      $("#privateChat_messageInput_SendButton").css("background-color","gray");
    // }
  });

  socket.on('load_private_chat_history_between_2Parties', function(chat_history) {
    //CLEAR previous chat
    $('#private_chat_display').empty();

    var chat_history_keys = Object.keys(chat_history);
    console.log('chat_history: ');
    console.log(chat_history);
    for(var i=0; i<chat_history_keys.length; i++) {
      var html_ToBe_added;
      console.log('message from history: ' + i);
      console.log(chat_history_keys[i]);
  		console.log(chat_history[chat_history_keys[i]]);
      tobe_Added = i + 1;
      console.log(("_" + tobe_Added));
      check_for_current_user = chat_history_keys[i].replace(("_" + tobe_Added), "");
      console.log('check_for_current_user');
      console.log(check_for_current_user);
      check_for_current_user = check_for_current_user.trim();
      console.log('after trim: ');
      console.log(check_for_current_user);
  		if(check_for_current_user == global_current_user) {
  				html_ToBe_added = create_A_SpanToAdd_ChatMessage(null, chat_history[chat_history_keys[i]], 'current_User_chatSpan_css');
  		}
  		else {
  				html_ToBe_added = create_A_SpanToAdd_ChatMessage(check_for_current_user, chat_history[chat_history_keys[i]], 'allOther_Users_chatSpan_css');
  		}
  		addMessages_to_MainChat('private_chat_display', html_ToBe_added);
    }
  });

	socket.on('chatMessage_to_WholeRoom', function(text_user, message_ToAll) {
		var html_ToBe_added;
		//console.log('message: ' + message_ToAll);
		if(text_user == global_current_user) {
				html_ToBe_added = create_A_SpanToAdd_ChatMessage(null, message_ToAll, 'current_User_chatSpan_css');
		}
		else {
				html_ToBe_added = create_A_SpanToAdd_ChatMessage(text_user, message_ToAll, 'allOther_Users_chatSpan_css');
		}
		addMessages_to_MainChat('room_chat_display', html_ToBe_added);

	});

  // $('div').animate({scrollTop: $('div').get(0).scrollHeight}, 3000);

  socket.on('chatMessage_to_Private_Room', function(sender_user, message_to_privateRoom) {
		var html_ToBe_added;
		//console.log('message: ' + message_to_privateRoom);
		if(sender_user == global_current_user) {
				html_ToBe_added = create_A_SpanToAdd_ChatMessage(null, message_to_privateRoom, 'current_User_chatSpan_css');
		}
		else {
				html_ToBe_added = create_A_SpanToAdd_ChatMessage(sender_user, message_to_privateRoom, 'allOther_Users_chatSpan_css');
		}
		addMessages_to_MainChat('private_chat_display', html_ToBe_added);
	});

  socket.on('user_left_the_room', function(username_who_left_the_current_room) {
    system_message_toall_users_in_room_saying_the_user_left = username_who_left_the_current_room + " has left the room";
    html_ToBe_added = create_A_SpanToAdd_ChatMessage(null, system_message_toall_users_in_room_saying_the_user_left, 'system_Messages_to_ChatRoom_css');
    addMessages_to_MainChat('room_chat_display', html_ToBe_added);
  });

  socket.on('private_chat_initiated_between_2Parties', function(reciever_user_name, sender_user_name, private_room_name) {
    var system_message_toall_private_chat_window;
    if(global_current_user == reciever_user_name) {
      system_message_toall_private_chat_window =  "private chat started between you and " + sender_user_name;
    }
    else if(global_current_user == sender_user_name){
      system_message_toall_private_chat_window =  "private chat started between you and " + reciever_user_name;
    }
    $('#private_chat_display').empty();
    html_ToBe_added = create_A_SpanToAdd_ChatMessage(null, system_message_toall_private_chat_window, 'system_Messages_to_ChatRoom_css');
    addMessages_to_MainChat('private_chat_display', html_ToBe_added);
    global_current_private_room = private_room_name;
  });

  socket.on('delete_this_element', function(element_tobe_deleted, all_private_rooms_disconnected_user_is_in) {
    $('#' + element_tobe_deleted).remove();
    for(var i=0;i<all_private_rooms_disconnected_user_is_in.length;i++) {
      if(global_current_private_room == all_private_rooms_disconnected_user_is_in[i]) {
        $('#private_chat_display').empty();
      }
    }
  });
});

function all_actions_after_creating_user(current_user_name) {
  //console.log('current user name: ' + current_user_name);
  $('#welcome_Message').html('Welcome! <span class="green_color_span"> ' + current_user_name + '</span>');
  $('#rooms_div').show();
  $('#userLogin_div').hide();
}

function populate_empty_rooms_data() {
  var fragment = document.createDocumentFragment();
  var opt = document.createElement('option');
  opt.innerHTML = "Choose an option";
  opt.value = "NothingSelected";
  opt.selected = "selected";
  fragment.appendChild(opt);
  $('#roomList_select').prepend(fragment);
}

//need to check if room name is already exists
function populate_rooms_Data(rooms_data, user_name) {
  //console.log('populate_rooms_Data is called');
  if(rooms_data != null) {
    var append_to_roomList = false;
    var fragment = document.createDocumentFragment();
    var opt;
    var all_keys_of_the_rooms = Object.keys(rooms_data);
    if(all_keys_of_the_rooms.length > 0) {
      for(var i=0;i<all_keys_of_the_rooms.length;i++) {
        var optionExists = ($("#roomList_select option[value=" + rooms_data[all_keys_of_the_rooms[i]].room_name + "]").length > 0);
        if(!optionExists) {
          opt = document.createElement('option');
          opt.innerHTML = rooms_data[all_keys_of_the_rooms[i]].room_name + ' (' + rooms_data[all_keys_of_the_rooms[i]].users.length + ')';
          opt.value = rooms_data[all_keys_of_the_rooms[i]].room_name;
          fragment.appendChild(opt);
          append_to_roomList = true;
        }
      }
    }
    if(append_to_roomList) {
      //console.log('append_to_roomList true');
      $('#roomList_select').append(fragment);
      console.log('user who created the room: ' + user_name + " and the global_current_user: " + global_current_user);
      if((user_name != undefined || global_current_user!= undefined) && user_name == global_current_user) {
        $('#status_creating_new_room').html("new room created");
      }
    }
  }
}

function update_rooms_select_options(room_name, number_of_users_in_the_room) {
  //console.log('update_rooms_select_options is called');
  $('#roomList_select option:contains("' + room_name + '")').text(room_name + "("+number_of_users_in_the_room+")");
}

function open_chat_div() {
  $('#chatSpace_div').show();
}

function create_A_SpanToAdd_ChatMessage(user_who_sent_message, chat_Text, span_ClassName) {
	var returnVal = "<span class=" + span_ClassName + ">";
  if(user_who_sent_message != null) {
    returnVal += user_who_sent_message + ": ";
  }
			returnVal += chat_Text;
			returnVal += "</span>";
	return returnVal;
}

function addMessages_to_MainChat(div_Element_Id, string_tobe_added) {
	$('#' + div_Element_Id).append("</br></br>"+string_tobe_added);
  updateScroll_OnChatSpace(div_Element_Id);
}

function empty_Chat_for_newRoom() {
  $('#room_chat_display').html('');
}

function show_all_current_Users(all_users_in_the_App) {
  //adding all the users in the app allUsers_div_css
  var allKeys = Object.keys(all_users_in_the_App);
  var check_for_disable_enable_privateChat_messageInput = false;
  for(var i=0; i < allKeys.length; i++) {
    if(all_users_in_the_App[allKeys[i]] != global_current_user) {
      console.log("check if user button is already created: " + all_users_in_the_App[allKeys[i]]);

      if($('#' + all_users_in_the_App[allKeys[i]]).length == 0) {
        console.log("user button is newly created");
        var htmlContent = "<li id='" + all_users_in_the_App[allKeys[i]] +"_li'>";
        htmlContent += "<button type='button' style='font-family: PT Sans;font-size: medium; border: 0px;border-radius:15px; background-color:gray' id=" + all_users_in_the_App[allKeys[i]] + " onclick = common_ClickEvent_Forall_Users(this.id) disabled>" + all_users_in_the_App[allKeys[i]] + "</button>";
        htmlContent += "</li>";
        $('#allUsers_div_ul').append(htmlContent);
        // finalHtml += htmlContent;
      }
      else {
        console.log("user button is already created");
      }
      check_for_disable_enable_privateChat_messageInput = true;
    }
  }
  //finalHtml += "</ul>";
  if(check_for_disable_enable_privateChat_messageInput) {
    $('#privateChat_messageInput').prop( "disabled", false );
  }
  // console.log(finalHtml);
}

function enable_user_name_in_allUsers(user_name) {
  $('#' + user_name).prop( "disabled", false );
  $("#select_username").css("background-color","buttonface");

}

function remove_CssClassFrom_HTML_Element(elementName, className) {
	if($('#' + elementName).hasClass(className)){
		$('#' + elementName).removeClass(className);
	}
}

function common_ClickEvent_Forall_Users(button_Id) {
  //console.log("private chat opened with: ");
  //console.log(button_Id);
  // //console.log($('#'+button_Id).val());
  if(button_Id != global_current_user) {
    socket.emit('initiate_private_message', button_Id);
    $('#' + button_Id).remove();

    var newUserNameButton = "<li id='" + button_Id +"_li'>";
    newUserNameButton += "<button type='button' style='font-family: PT Sans;font-size: medium;border: 0px;border-radius:15px; background-color:#558B2F' id=" + button_Id + " onclick = common_ClickEvent_Forall_Users(this.id) >" + button_Id + "</button>";
    newUserNameButton += "</li>";
    $('#allUsers_div_ul').prepend(newUserNameButton);
    // document.getElementById(button_Id).style.background='#558B2F';
    //move the button li on top of the ui

  }
}

function updateScroll_OnChatSpace(div_element_Id){
    var element = document.getElementById(div_element_Id);

    element.scrollTop = element.scrollHeight;
}
