import React, { useState, useEffect, useContext } from 'react';
import './Notification.css';
import { MyContext } from '../ContextProvider/ContextProvider';
import NotificationIcon from '../IconComponents/NotificationIcon';

const Notification = ({ duration = 5000, historyLimit = 5 }) => {
    const { context } = useContext(MyContext);
    const [message, setMessage] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [showHistory, setShowHistory] = useState(false); // New state for history box visibility
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationHistory, setNotificationHistory] = useState([]);
    const [notificationType, setNotificationType] = useState(''); // info, alert, warning, error

    useEffect(() => {
        const message = context.serverData.dashboardNotification.message;
        const notificationType = context.serverData.dashboardNotification.notificationType;

        if (message) {
            setShowNotification(true);
            setNotificationMessage(message);
            setNotificationType(notificationType);

            setNotificationHistory((prevHistory) => {
                const updatedHistory = [message, ...prevHistory];
                return updatedHistory.slice(0, historyLimit);
            });

            const timer = setTimeout(() => {
                setShowNotification(false);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [context.serverData.dashboardNotification, duration, historyLimit]);

    return (
        <div className="container">
            <div className="icon" onClick={() => {
                setShowNotification(!showNotification);
                setShowHistory(!showHistory); 
            }}>
                <NotificationIcon/>
            </div>
            {(showNotification && !showHistory) && (
                <div className="notificationBox">
                    <div className="notificationContent">
                        <div className={`statusBar notification-${notificationType}`}></div>
                        <div className="messageContent">
                            <div className={`title text-${notificationType}`}>SERVER: {notificationType.toUpperCase()}</div>
                            <div className="message">{notificationMessage}</div>
                        </div>
                        <button className="closeButton" onClick={() => setShowNotification(false)}>
                            ×
                        </button>
                    </div>
                </div>
            )}
            {showHistory && ( 
                <div className="historyBox">
                    <strong>Recent Notifications:</strong>
                    {notificationHistory.length > 0 ? (
                        notificationHistory.map((msg, index) => (
                            <div key={index} className="historyItem">
                                {msg}
                            </div>
                        ))
                    ) : (
                        <div>No notifications.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notification;
