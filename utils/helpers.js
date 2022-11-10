function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const generateUsername = (name, phone) => {
  const firstName = name.substring(0, 4);
  const num = phone.substring(0, 2);
  const x = makeid(2);
  return firstName + num + x;
};
module.exports = {
  generateUsername,
};
