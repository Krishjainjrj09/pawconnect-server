require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');
const Pet      = require('./models/Pet');
const LostFound = require('./models/LostFound');

const petPhotos = {
  dog: [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=400&fit=crop',
  ],
  cat: [
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=400&h=400&fit=crop',
  ],
  rabbit: [
    'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=400&h=400&fit=crop',
  ],
};

const PETS = [
  { name:'Buddy',    species:'dog',    breed:'Golden Retriever',  age:'3 years',   ageMonths:36,  gender:'male',   size:'large',  location:'Hyderabad', vaccinated:true,  neutered:true,  goodWithKids:true,  shelter:'Happy Paws Shelter',   description:'Buddy is a friendly and energetic Golden Retriever who loves playing fetch and cuddles.' },
  { name:'Luna',     species:'cat',    breed:'Siamese',           age:'2 years',   ageMonths:24,  gender:'female', size:'small',  location:'Bangalore', vaccinated:true,  neutered:true,  goodWithKids:true,  shelter:'City Cat Rescue',      description:'Luna is a graceful Siamese who enjoys sitting by windows and gentle petting.' },
  { name:'Rocky',    species:'dog',    breed:'German Shepherd',   age:'1 year',    ageMonths:12,  gender:'male',   size:'large',  location:'Chennai',   vaccinated:true,  neutered:false, goodWithKids:false, shelter:'Stray Aid Foundation', description:'Rocky is a young intelligent shepherd who needs an active family.' },
  { name:'Mochi',    species:'cat',    breed:'Persian',           age:'4 months',  ageMonths:4,   gender:'female', size:'small',  location:'Mumbai',    vaccinated:false, neutered:false, goodWithKids:true,  shelter:'Mumbai Cat Home',      description:'Tiny Mochi is a fluffy Persian kitten looking for a cozy indoor home.' },
  { name:'Bruno',    species:'dog',    breed:'Labrador',          age:'5 years',   ageMonths:60,  gender:'male',   size:'large',  location:'Delhi',     vaccinated:true,  neutered:true,  goodWithKids:true,  shelter:'Delhi Animal Care',    description:'Calm and gentle Bruno is great with kids and other pets.' },
  { name:'Cleo',     species:'rabbit', breed:'Holland Lop',       age:'1.5 years', ageMonths:18,  gender:'female', size:'small',  location:'Pune',      vaccinated:false, neutered:true,  goodWithKids:true,  shelter:'Bunny Haven',          description:'Cleo is a sweet Holland Lop who enjoys being held.' },
  { name:'Simba',    species:'cat',    breed:'Maine Coon',        age:'3 years',   ageMonths:36,  gender:'male',   size:'medium', location:'Hyderabad', vaccinated:true,  neutered:true,  goodWithKids:true,  shelter:'Happy Paws Shelter',   description:'Majestic Simba loves lazy afternoons and chin scratches.' },
  { name:'Pepper',   species:'dog',    breed:'Beagle Mix',        age:'2 years',   ageMonths:24,  gender:'female', size:'medium', location:'Kolkata',   vaccinated:true,  neutered:false, goodWithKids:true,  shelter:'Kolkata SPCA',         description:'Pepper has a nose for adventure and is super friendly.' },
  { name:'Oreo',     species:'dog',    breed:'Dalmatian',         age:'8 months',  ageMonths:8,   gender:'male',   size:'medium', location:'Bangalore', vaccinated:true,  neutered:false, goodWithKids:true,  shelter:'City Cat Rescue',      description:'Playful Oreo loves to run around and make new friends.' },
  { name:'Whiskers', species:'cat',    breed:'Tabby',             age:'6 years',   ageMonths:72,  gender:'male',   size:'small',  location:'Mumbai',    vaccinated:true,  neutered:true,  goodWithKids:false, shelter:'Mumbai Cat Home',      description:'Gentle senior Whiskers prefers quiet homes and lots of lap time.' },
  { name:'Daisy',    species:'rabbit', breed:'Mini Rex',          age:'1 year',    ageMonths:12,  gender:'female', size:'small',  location:'Chennai',   vaccinated:false, neutered:true,  goodWithKids:true,  shelter:'Bunny Haven',          description:'Velvet-soft Daisy is curious and loves fresh greens.' },
  { name:'Max',      species:'dog',    breed:'Indian Pariah',     age:'2.5 years', ageMonths:30,  gender:'male',   size:'medium', location:'Hyderabad', vaccinated:true,  neutered:true,  goodWithKids:true,  shelter:'Stray Aid Foundation', description:'Max is a sturdy loyal Indie dog who is house trained.' },
];

const LF_DATA = [
  { type:'lost',  name:'Charlie',  species:'dog',    breed:'Poodle',   color:'White',       location:'Banjara Hills, Hyderabad', description:'Lost near the park on Sunday evening. Very friendly, responds to Charlie.', contact:'9876543210', reward:'₹5,000' },
  { type:'found', name:'Unknown',  species:'cat',    breed:'Tabby',    color:'Orange',      location:'Indiranagar, Bangalore',   description:'Found near the bus stop, thin but friendly. Has a green collar with no tag.', contact:'9812345678' },
  { type:'lost',  name:'Tommy',    species:'dog',    breed:'Lab Mix',  color:'Black',       location:'Anna Nagar, Chennai',      description:'Missing since Friday. Black Lab mix, microchipped. Limps slightly on left leg.', contact:'9988776655', reward:'₹10,000' },
  { type:'found', name:'Unknown',  species:'rabbit', breed:'Unknown',  color:'Grey',        location:'Koramangala, Bangalore',   description:'Found a grey rabbit near the apartment complex. Seems domesticated.', contact:'9876500000' },
  { type:'lost',  name:'Sheru',    species:'dog',    breed:'German Shepherd', color:'Brown-Black', location:'Dwarka, Delhi', description:'Sheru got scared by firecrackers and ran away. He is very friendly.', contact:'9711223344', reward:'₹8,000' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔗 Connected to MongoDB');

  await Promise.all([User.deleteMany(), Pet.deleteMany(), LostFound.deleteMany()]);
  console.log('🗑  Cleared existing data');

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@pawconnect.in',
    password: 'Admin@1234',
    role: 'admin',
  });
  console.log('👤 Admin created: admin@pawconnect.in / Admin@1234');

  await User.create({
    name: 'Demo User',
    email: 'user@pawconnect.in',
    password: 'User@1234',
    role: 'user',
  });
  console.log('👤 Demo user: user@pawconnect.in / User@1234');

  const petDocs = PETS.map((p, i) => {
    const photos = petPhotos[p.species] || petPhotos.dog;
    return { ...p, photos: [photos[i % photos.length]], addedBy: admin._id };
  });
  await Pet.insertMany(petDocs);
  console.log(`🐾 ${petDocs.length} pets seeded`);

  const lfDocs = LF_DATA.map(r => ({ ...r, reportedBy: admin._id }));
  await LostFound.insertMany(lfDocs);
  console.log(`🔍 ${lfDocs.length} L&F reports seeded`);

  console.log('\n✅ Seed complete!\n');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });