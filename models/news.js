import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
      headline:{
            type: String,
            required: true,
            unique: true
      },
      newsPaper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NewsPaper'
          },
},
{timestamps: true}
);

export default mongoose.model('News', newsSchema)
//export default mongoose.models['User'] || mongoose.model('User', userSchema);