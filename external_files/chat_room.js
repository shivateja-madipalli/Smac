var socket = io();

jQuery(document).ready(function($) {
	//roomList
	if(localStorage.getItem("roomData") == null) {
		window.location = "http://localhost:3000";
	}
	var roomsData = window.localStorage.getItem('roomData');

	var parsedRooms_Data = JSON.parse(roomsData);

	$('#welcome_Note').html("Welcome! " + parsedRooms_Data.user_name + " to Chat App");

	var fragment = document.createDocumentFragment();
	var opt = document.createElement('option');
	opt.innerHTML = "Choose an option";
	opt.value = "NothingSelected";
	fragment.appendChild(opt);
	for(var i=0;i<parsedRooms_Data.rooms.length;i++) {
		opt = document.createElement('option');
		opt.innerHTML = parsedRooms_Data.rooms[i];
		opt.value = parsedRooms_Data.rooms[i];
		fragment.appendChild(opt);
	}

	rooms_ddl = $('#roomList');
	console.log(rooms_ddl);
	$('#roomList').append(fragment);

	//global variable to save previously selected room
	var previous_Room;
	var current_Room;
	var current_User = parsedRooms_Data.user_name;

	$('#roomList').on('change', function (e) {
		var room_Selected = $('#roomList').val();
		if(room_Selected !== 'NothingSelected') {
			if(jQuery.isEmptyObject(previous_Room)) {
				console.log('inside previous room empty');
				var res_obj = {
					"user_Name" : parsedRooms_Data.user_name,
					"room_Selected" : room_Selected
				}
				previous_Room = room_Selected;
				current_Room = room_Selected;
				socket.emit('user_selected_room', res_obj);
				add_CssClassTo_HTML_Element('chatSpace_div', 'chatDiv_DisplayTrue_css');
			}
			else if(!(jQuery.isEmptyObject(previous_Room)) && room_Selected !== previous_Room) {
				console.log('inside previous room NOT empty');
				var res_obj = {
					"user_Name" : parsedRooms_Data.user_name,
					"room_Selected" : room_Selected
				}
				socket.emit('user_left_room', previous_Room);
				previous_Room = room_Selected;
				current_Room = room_Selected;
				socket.emit('user_selected_room', res_obj);
				add_CssClassTo_HTML_Element('chatSpace_div', 'chatDiv_DisplayTrue_css');
			}
			else {
				console.log('DAMN');
				remove_CssClassFrom_HTML_Element('chatSpace_div', 'chatDiv_DisplayTrue_css');
			}
		}
		else {
			previous_Room = null;
			current_Room = null;
			remove_CssClassFrom_HTML_Element('chatSpace_div', 'chatDiv_DisplayTrue_css');
		}
	});

	socket.on('user_Joined', function(result) {
		//this will be invoked when ever a new user joins the room
		system_Message_ToAll_ChatRoom_Users = result + " Has joined the room";
		html_ToBe_added = create_A_SpanToAdd_ChatMessage(system_Message_ToAll_ChatRoom_Users, 'system_Messages_to_ChatRoom_css');
		addMessages_to_MainChat('chatSpace_table_row_td1_table_tr1_td', html_ToBe_added);
		console.log(result);
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

	$('#text_Message_SendButton').on('click', function(e){
		// socket input is: chat_Message
		chatMessage = $('#text_Message_input').val();
		socket.emit('chat_Message', current_Room, current_User, chatMessage);
	});

	socket.on('chatMessage_to_WholeRoom', function(chatMsg_and_CurrentUser_Json) {
		var html_ToBe_added;
		console.log('message: ' + chatMsg_and_CurrentUser_Json.message_ToAll);
		if(chatMsg_and_CurrentUser_Json.current_User == current_User) {
				html_ToBe_added = create_A_SpanToAdd_ChatMessage(chatMsg_and_CurrentUser_Json.message_ToAll, 'current_User_chatSpan_css');
		}
		else {
				html_ToBe_added = create_A_SpanToAdd_ChatMessage(chatMsg_and_CurrentUser_Json.message_ToAll, 'allOther_Users_chatSpan_css');
		}
		addMessages_to_MainChat('chatSpace_table_row_td1_table_tr1_td', html_ToBe_added);

	});

	$('#logout').on('click', function(e) {
		localStorage.removeItem('roomData');
		if(!(jQuery.isEmptyObject(previous_Room))) {
			socket.emit('user_left_room', previous_Room);
		}
		window.location = "http://localhost:3000";
	});

});

function add_CssClassTo_HTML_Element(elementName, className) {
	$('#' + elementName).addClass(className);
}

function remove_CssClassFrom_HTML_Element(elementName, className) {
	if($('#' + elementName).hasClass(className)){
		$('#' + elementName).removeClass(className);
	}
}

function addMessages_to_MainChat(div_Element_Id, string_tobe_added) {
	$('#' + div_Element_Id).append("</br></br>"+string_tobe_added);
}

function create_A_SpanToAdd_ChatMessage(chat_Text, span_ClassName) {
	var returnVal = "<span class=" + span_ClassName + ">";
			returnVal += chat_Text;
			returnVal += "</span>";
			console.log('create_A_SpanToAdd_ChatMessage: ' + returnVal);
	return returnVal;
}
