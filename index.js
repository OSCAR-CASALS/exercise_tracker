const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let mongoose = require("mongoose");
let bodyParser = require("body-parser");

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({extended: false}));

// Seting conection to database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let user_schema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  description: {
    type: [String],
    required: true
  },
  duration: {
    type: [Number],
    required: true
  },
  date: {
    type: [Date],
    required: true
  }
});


let user_model = mongoose.model("User", user_schema);

async function retrieve_user(req, res){
  let all_user = await user_model.find().select({"username": 1, "_id": 1});
  res.json(all_user);
}

async function create_user(req, res){

  let name_of_user = req.body.username;
  let newUser = new user_model({
    username: name_of_user,
    description: [],
    duration: [],
    date: []
  });
  
  let save_doc = await newUser.save();

  res.json({
    username: save_doc.username,
    _id: save_doc._id
  });

}

app.route("/api/users").get(retrieve_user).post(create_user);

async function add_exercise(req, res){
  
  let descript = req.body.description;

  let dur = req.body.duration;

  let dat = req.body.date;

  console.log(dat);

  let da;

  if(!req.body.date){
    da = new Date().toString();
  }else{
    da = new Date(dat).toString();
  }

  let user_to_mod = await user_model.findByIdAndUpdate(
    req.body[":_id"],
    {$push : {
      description: descript,
      duration: dur,
      date: da
    }},
    {new: true}
  );

  if(!user_to_mod){
    console.log("Not Found")
    res.json({
      username: "",
      description: "",
      duration: "",
      date: "",
      _id: ""
    });
  }else{
    res.json({
      username: user_to_mod.username,
      description: user_to_mod.description[user_to_mod.description.length - 1],
      duration: user_to_mod.duration[user_to_mod.duration.length - 1],
      date: user_to_mod.date[user_to_mod.date.length - 1].toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' }).replace(/,/g, ""),
      _id: user_to_mod._id
    });
  }
}

app.post("/api/users/:_id/exercises", add_exercise);


async function retrieve_full_exercise(req, res){
  let id_user = req.params._id;

  let user = await user_model.findById(id_user);

  let count_exercises = user.description.length;

  let logs = []

  let limit = count_exercises;

  if(req.query.limit){
    limit = Number(req.query.limit);
  }

  let start_date;
  let end_date;
  let check_dates = false;

  if(req.query.from){
    start_date = new Date(req.query.from);
    check_dates = true;
    if(req.query.to){
      end_date = new Date(req.query.to);
    }else{
      end_date = new Date();
    }
  }

  for(let i = 0; i + 1 <= count_exercises; i++){
    if(check_dates == true){
      if((user.date[i] >= start_date) && (user.date[i] <= end_date)){
        logs.push({
          description: user.description[i],
          duration: user.duration[i],
          date: user.date[i]
        });
      }
    }else{
      logs.push({
        description: user.description[i],
        duration: user.duration[i],
        date: user.date[i]
      });
    }

    if(logs.length == limit){
      break;
    }
  }

  res.json({username: user.username, _id: user._id, count: count_exercises, log: logs});
  
}

app.get("/api/users/:_id/logs", retrieve_full_exercise);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
