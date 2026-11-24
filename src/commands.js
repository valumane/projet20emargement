export const trigramme = process.env.TRIGRAMME || 'abc';
if (!/^[a-z]{3}$/.test(trigramme)) throw new Error('TRIGRAMME doit contenir trois lettres minuscules.');
const date = { name: 'date', description: 'Date au format AAAA-MM-JJ', type: 3, required: true };
export const commands = [
  { name: 'blep', description: 'Choisir un animal', type: 1, options: [
    { name: 'animal', description: 'Animal', type: 3, required: true, choices: [
      { name: 'Dog', value: 'animal_dog' }, { name: 'Cat', value: 'animal_cat' }, { name: 'Penguin', value: 'animal_penguin' },
    ] },
  ] },
  { name: `${trigramme}-presence`, description: 'Consulter ses présences à une date', type: 1, options: [date] },
  { name: `${trigramme}-emarger`, description: 'Enregistrer sa présence ou son absence', type: 1, options: [
    date,
    { name: 'demi-journee', description: 'Demi-journée', type: 3, required: true, choices: [
      { name: 'Matin', value: 'matin' }, { name: 'Après-midi', value: 'apres-midi' },
    ] },
    { name: 'statut', description: 'Présent ou absent', type: 3, required: true, choices: [
      { name: 'Présent', value: 'present' }, { name: 'Absent', value: 'absent' },
    ] },
    { name: 'motif', description: 'Obligatoire pour une absence', type: 3, max_length: 1000 },
  ] },
];
