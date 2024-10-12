import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
      username:{
            type: String,
            required: true,
            unique: true
      },
      password:{
            type: String,
            required: true
      },
      name:{
            type: String,
            require:true
      },
      coords:[Number],
      image:{
            type: String
      }
},
{timestamps: true}
);

export default mongoose.model('NewsPaper', newsSchema)
//export default mongoose.models['User'] || mongoose.model('User', userSchema);