//landing page.js

jQuery(document).ready(function($) {

  var socket = io();
  populate_empty_rooms_data();

  console.log('page landed');

  $('#select_username').on('click', function(event){
    event.preventDefault();
    new_user_name = $('#user_Name').val();
    if(!(jQuery.isEmptyObject(new_user_name))) {
      console.log(new_user_name);
      socket.emit('new_user', new_user_name);
    }
    return false;
  });

  var global_current_user;

  socket.on('new_user_details', function(current_user) {
    if(!(jQuery.isEmptyObject(current_user))) {
      console.log(current_user);
      global_current_user = current_user;
      all_actions_after_creating_user(current_user);
    }
    else {
      alert('User name already exists');
      $('#select_username').val(null);
    }
  });

  socket.on('populate_all_user_data', function(all_Users){
    if(!(jQuery.isEmptyObject(all_Users))) {
      console.log(all_Users);
      //show the users with whom he current user is chatting on top
      show_all_current_Users(all_Users);
    }
  });

  $('#create_new_room_name').on('click', function(event){
    var newly_created_room = $('#new_room_name').val();
    if(!(jQuery.isEmptyObject(newly_created_room))) {
      socket.emit('new_room', newly_created_room);
      $('#new_room_name').val('');
    }
  });

  var global_previous_room_name;
  var global_current_room;

  $('#roomList_select').on('change', function(e) {
    var room_Selected = $('#roomList_select').val();
		if(room_Selected !== 'NothingSelected') {
			if(jQuery.isEmptyObject(global_previous_room_name)) {
				console.log('inside previous room empty');
        console.log('global_current_user' + global_current_user);
        var res_obj = {
					"username" : global_current_user,
					"room_selected" : room_Selected
				}
				global_previous_room_name = room_Selected;
				global_current_room = room_Selected;

				socket.emit('user_selected_room', res_obj);
			}
			else if(!(jQuery.isEmptyObject(global_previous_room_name)) && room_Selected !== global_previous_room_name) {
				console.log('inside previous room NOT empty');
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
				console.log('DAMN');
				remove_CssClassFrom_HTML_Element('chatSpace_div', 'chatDiv_DisplayTrue_css');
			}
		}
		else {
			global_previous_room_name = null;
			global_current_room = null;
			remove_CssClassFrom_HTML_Element('chatSpace_div', 'chatDiv_DisplayTrue_css');
		}
  });

  socket.on('rooms_data_Updates', function(rooms_data) {
    populate_rooms_Data(rooms_data);
  });

  socket.on('user_joined_a_room', function(newly_joined_user) {
    console.log('user_joined_a_room is called');
    //this will be invoked when ever a new user joins the room
    open_chat_div();
    system_message_toall_users_in_room = newly_joined_user + " has joined the room";
    html_ToBe_added = create_A_SpanToAdd_ChatMessage(null, system_message_toall_users_in_room, 'system_Messages_to_ChatRoom_css');
    addMessages_to_MainChat('chatSpace_table_row_td1_table_tr1_td', html_ToBe_added);
  });

  socket.on('update_rooms_count', function (all_users_count_in_current_room, room_name){
    // var user_count_inthis_room = Object.keys(all_users_in_current_room).length;
    update_rooms_select_options(room_name, all_users_count_in_current_room);
  });

  $('#text_Message_input').keyup(function(e) {
		chatMessage = $('#text_Message_input').val();
		if($(this).val().length !=0) {
			$('#text_Message_SendButton').prop( "disabled", false );
		}
		else {
			$('#text_Message_SendButton').prop( "disabled", true );
		}
	});

	$('#text_Message_SendButton').on('click', function(e) {
		// socket input is: chat_Message
		chatMessage = $('#text_Message_input').val();
    console.log('exec in send text msg');
    console.log(chatMessage);
		socket.emit('chat_Message', global_current_room, global_current_user, chatMessage);
    $('#text_Message_input').val('');
	});

	socket.on('chatMessage_to_WholeRoom', function(text_user, message_ToAll) {
		var html_ToBe_added;
		console.log('message: ' + message_ToAll);
		if(text_user == global_current_user) {
				html_ToBe_added = create_A_SpanToAdd_ChatMessage(null, message_ToAll, 'current_User_chatSpan_css');
		}
		else {
				html_ToBe_added = create_A_SpanToAdd_ChatMessage(text_user, message_ToAll, 'allOther_Users_chatSpan_css');
		}
		addMessages_to_MainChat('chatSpace_table_row_td1_table_tr1_td', html_ToBe_added);

	});

  socket.on('user_left_the_room', function(username_who_left_the_current_room) {
    system_message_toall_users_in_room_saying_the_user_left = username_who_left_the_current_room + " has left the room";
    html_ToBe_added = create_A_SpanToAdd_ChatMessage(null, system_message_toall_users_in_room_saying_the_user_left, 'system_Messages_to_ChatRoom_css');
    addMessages_to_MainChat('chatSpace_table_row_td1_table_tr1_td', html_ToBe_added);
  });
});

function all_actions_after_creating_user(current_user_name) {
  console.log('current user name: ' + current_user_name);
  $('#welcome_Message').html('Welcome! ' + current_user_name + ' to Chat App');
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
function populate_rooms_Data(rooms_data) {
  console.log('populate_rooms_Data is called');
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
      console.log('append_to_roomList true');
      $('#roomList_select').append(fragment);
    }
  }
}

function update_rooms_select_options(room_name, number_of_users_in_the_room) {
  console.log('update_rooms_select_options is called');
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
}

function empty_Chat_for_newRoom() {
  $('#chatSpace_table_row_td1_table_tr1_td').html('');
}

function show_all_current_Users(all_users_in_the_App) {
  //adding all the users in the app chatSpace_table_row_td2_css
  var allKeys = Object.keys(all_users_in_the_App);
  var finalHtml;
  finalHtml = "<table>";
  for(var i=0; i < allKeys.length; i++) {
    var htmlContent = "<tr>";
    htmlContent += "<td>";
    htmlContent += "<button type='button' id=" + allKeys[i] + ">" + all_users_in_the_App[allKeys[i]] + "</button>";
    htmlContent += "</td>";
    htmlContent += "</tr>";
    finalHtml += htmlContent;
  }
  finalHtml += "</table>";
  $('#chatSpace_table_row_td2').html(finalHtml);
}

function remove_CssClassFrom_HTML_Element(elementName, className) {
	if($('#' + elementName).hasClass(className)){
		$('#' + elementName).removeClass(className);
	}
}

function add_all_users_in_current_room(all_users_in_current_room) {
  if(all_users_in_current_room != null) {
    //add a ul - li to 'chatSpace_table_row_td2' div
    $('#chatSpace_table_row_td2').html("");
    allKeys = Object.keys(all_users_in_current_room);
    var html_content = "<ul>";
      for(var i=0;i<allKeys.length;i++) {
        html_content += "<li>";
        html_content += "<button type='button'>"+all_users_in_current_room[allKeys[i]]+"</button>";
        html_content += "</li>";
      }
    html_content += "</ul>";
    $('#chatSpace_table_row_td2').html(html_content);
  }
}
