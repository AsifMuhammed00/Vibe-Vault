import "./contactlist.css"

function ContactList() {
    const contacts = [
        {
          id: 1,
          name: "John Doe",
          avatar: "https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg?cs=srgb&dl=pexels-anjana-c-674010.jpg&fm=jpg",
          status: "online",
        },
        {
          id: 2,
          name: "Jane Doe",
          avatar: "https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg?cs=srgb&dl=pexels-anjana-c-674010.jpg&fm=jpg",
          status: "offline",
        },
        // ...more contacts
      ];
      
    return (
      <ul className="contact-list">
        {contacts.map((contact) => (
          <li key={contact.id} className="contact">
            <img src={contact.avatar} alt={contact.name} className="avatar" />
            <div className="info">
              <h2>{contact.name}</h2>
              <span className="status">{contact.status}</span>
            </div>
          </li>
        ))}
      </ul>
    );
  }
  export default ContactList
  