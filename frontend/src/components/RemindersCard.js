import React from 'react';
import './RemindersCard.css';

const RemindersCard = ({ reminders }) => {
  const activeReminders = reminders.filter(r => !r.is_completed) || [];

  return (
    <div className="reminders-card">
      <div className="reminders-header">
        <h3 className="card-title">
          Upcoming Items
        </h3>
      </div>
      <div className="reminders-content">
        {activeReminders.length > 0 ? (
          <div className="reminders-list">
            {activeReminders.slice(0, 5).map((reminder) => (
              <div key={reminder.id} className="reminder-item">
                <div className="reminder-info">
                  <span className="reminder-title">{reminder.title}</span>
                  <span className="reminder-date">
                    Due: {new Date(reminder.due_date).toLocaleDateString()}
                  </span>
                </div>
                <span className="reminder-amount">${reminder.amount}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-message">No upcoming reminders</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemindersCard;


