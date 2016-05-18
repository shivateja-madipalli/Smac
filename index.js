var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);




app.all('*',function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.static('external_files'));

app.get('/', function(req, res){
  //  res.sendFile('index.html');
  res.sendFile("./landing_page.html", { root: __dirname });
});

app.get('/chatroom', function(req, res) {
  res.sendFile("./chatRoom.html", {root: __dirname});
});

//global variables

var users = {};

var rooms = {};

var privateRooms = [];

sockets = [];

var saving_private_chat = {};


// var return_for_user_signup = {
//   "welcome_note": "Welcome! to the Chat App",
//   "rooms": {
//     "Casual": {
//       "loggedin_users": ["user1", "user2", "user3"]
//     },
//     "AllDev": {
//       "loggedin_users": ["user4", "user5", "user6"]
//     }
//   }
// }


io.on('connection', function(socket) {

  sockets.push(socket);

  //console.log('a user connected with socket id: ' + socket.id);

  if(Object.keys(rooms).length > 0) {
    //console.log('rooms:');
    //console.log(rooms);
    io.sockets.emit('rooms_data_Updates', rooms);
  }
  else {
    //console.log('rooms:');
    //console.log(rooms);
  }

  socket.on('new_user', function(user_name) {
    var user_name_exists = false;
    if(Object.keys(users).length > 0) {
      //console.log('inside user length > 0: ' + users);
      for(var i=0;i<Object.keys(users).length;i++) {
        users[Object.keys(users)[i]]
        if(users[Object.keys(users)[i]] === user_name) {
          user_name_exists = true;
          socket.emit('new_user_details', null);
          break;
        }
      }
    }
    if(!user_name_exists) {
      //console.log('new user name creating in process');
      socket.nickname = user_name;
      // users.push({id : socket.id, username : user_name});
      users[socket.id] = user_name;
      //console.log(users);
      socket.emit('new_user_details', users[socket.id]);
      io.sockets.emit('populate_all_user_data', users);
    }
  });

  socket.on('new_room', function(room_name) {

    var room_name_exists = false;
    //console.log(rooms);
    var all_keys_of_rooms = Object.keys(rooms);
    if(all_keys_of_rooms.length > 0) {
      Object.keys(rooms).forEach(function(key) {
        //console.log('check');
        //console.log(rooms[key]);
        if(rooms[key].room_name == room_name) {
          //console.log('inside room name found');
          room_name_exists = true;
          io.sockets.emit('rooms_data_Updates', null);
        }
      });
    }
    if(!room_name_exists) {
      //console.log('new room name creating in process');
      var json_to_save_room_data = {
        "room_name" : room_name,
        "users" : []
      };
      // rooms.push(room_name);
      // //console.log(rooms);
      rooms[room_name] = json_to_save_room_data;
      io.sockets.emit('rooms_data_Updates', rooms);
    }
    else {
      //console.log('new room name creating NOT in process');
    }
  });

  //io to be used to send messages to all users
  //socket to the particular user

  socket.on('chat_Message', function(room_name, current_User, text_Msg, privateOrNot) {
    if(privateOrNot) {
      io.to(room_name).emit('chatMessage_to_Private_Room', current_User, text_Msg);
      // saving_private_chat[room_name].push(current_User + ": " + text_Msg);
      console.log('saving data into private chat room:');
      //finding count
      count = Object.keys(saving_private_chat[room_name]).length;
      keyVal = current_User + "_" + (parseInt(count) + 1);
      saving_private_chat[room_name][keyVal] = text_Msg;
      console.log(saving_private_chat);
    }
    else{
      io.to(room_name).emit('chatMessage_to_WholeRoom', current_User, text_Msg);
    }
  });

  socket.on('user_selected_room', function(selected_room_data) {
    //console.log(selected_room_data);
    socket.join(selected_room_data.room_selected);

    //get all the users under this room
    var socketsInRoom = io.sockets.adapter.rooms[selected_room_data.room_selected]; // sockets = default "/" namespace

    //adding socket or user to the rooms JSON
    rooms[selected_room_data.room_selected].users.push(socket.id);

    users_count_in_current_room = rooms[selected_room_data.room_selected].users.length;

    //console.log(users_count_in_current_room);

    io.to(selected_room_data.room_selected).emit('user_joined_a_room', selected_room_data.username);
    io.sockets.emit('update_rooms_count',users_count_in_current_room, selected_room_data.room_selected);
  });

  socket.on('user_left_room', function(user_left_room) {
    if(user_left_room != null) {
      socket.leave(user_left_room);
    }
  });

  socket.on('initiate_private_message', function(receiver_name) {
    //private chat open
    //get socket id with user name
    var receiver_id;
    Object.keys(users).forEach(function(key) {
      if(users[key] == receiver_name) {
        receiver_id = key;
      }
    });
    current_login_user = users[socket.id];

    var room_name_for_private_chatting = "privateRoom_" + current_login_user + "_And_" + receiver_name + "_";
    var alternate_room_name_for_private_chatting = "privateRoom_" + receiver_name + "_And_" + current_login_user + "_";
    console.log('room_name_for_private_chatting: ');
    console.log(room_name_for_private_chatting);

    //check if private chat have been already initiated
    var privateRoomFound = false;
    var all_keys_of_private_rooms = Object.keys(saving_private_chat);
    if(all_keys_of_private_rooms.length > 0) {
      all_keys_of_private_rooms.forEach(function(key) {
        if(key.indexOf("_" + current_login_user + "_") != -1 && key.indexOf("_" + receiver_name + "_") != -1) {
          privateRoomFound = true;
        }
      });

      if(privateRoomFound) {
        console.log('privateRoomFound is true');
        var all_chat_history = saving_private_chat[room_name_for_private_chatting];
        var using_alternate_room_name = false;
        if(all_chat_history == undefined) {
          using_alternate_room_name = true;
          var all_chat_history = saving_private_chat[alternate_room_name_for_private_chatting];
        }
        console.log('retrieving chat history of already existing chat between these users: ' + current_login_user + ' and ' + receiver_name);
        // console.log(saving_private_chat);
        console.log(all_chat_history);
        if(using_alternate_room_name) {
          io.to(alternate_room_name_for_private_chatting).emit('load_private_chat_history_between_2Parties', all_chat_history);
        }
        else {
          io.to(room_name_for_private_chatting).emit('load_private_chat_history_between_2Parties', all_chat_history);
        }

      }
      else {
        console.log('inside privateRoomFound is FALSE');
      }
    }
    if(!privateRoomFound || all_keys_of_private_rooms.length == 0) {
      console.log('creating a new private chat between: ' + current_login_user + ' and ' + receiver_name);
      privateRooms.push[room_name_for_private_chatting];
      socket.join(room_name_for_private_chatting);
      io.sockets.connected[receiver_id].join(room_name_for_private_chatting);
      io.to(room_name_for_private_chatting).emit('private_chat_initiated_between_2Parties', receiver_name, current_login_user, room_name_for_private_chatting);
      saving_private_chat[room_name_for_private_chatting] = {};
      console.log('a new entry into saving_private_chat json is created with key: ' + room_name_for_private_chatting);
    }

  });

  socket.on('disconnect', function(){
    //console.log('user disconnected');
    var users_of_room;
    Object.keys(rooms).forEach(function(key) {
      users_of_room = rooms[key].users;
      //console.log(users_of_room);
      index_of_socket_in_rooms = users_of_room.indexOf(socket.id);
      if(index_of_socket_in_rooms != -1) {
        username_of_the_socket = users[socket.id];
        io.to(key).emit('user_left_the_room', username_of_the_socket);
        // users_of_room.remove(socket.id);
        // delete users_of_room[index_of_socket_in_rooms];
        users_of_room.splice(index_of_socket_in_rooms, 1);
        rooms[key].users = users_of_room;
        changed_users_count_in_current_room = users_of_room.length;
        // //console.log('###########');
        // //console.log(rooms);
        // //console.log(changed_users_count_in_current_room);
        // //console.log('###########');
        io.sockets.emit('update_rooms_count',changed_users_count_in_current_room, key);
      }
    });
    delete users[socket.id];

    io.sockets.emit('populate_all_user_data', users);
  });
});




http.listen(3000, function(){
  console.log('listening on *:3000');
});
