import Head from "next/head";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { Navbar } from "@frontend/components/Nav";
import { UsernamePopup } from "@frontend/components/UsernamePopup";
import log from "@shared/logger";
import Pusher from "pusher-js";
import axios from 'axios'

export default function Home() {
	const { data: session } = useSession();
	const [showUsernameInput, setShowUsernameInput] = useState(false);
	const [username, setUsername] = useState();
	const [chats, setChats] = useState([]);
	const myEmail = session?.user.email;
	const name = session?.user.name;
	const pfp = session?.user.image;
	const messageField = useRef(null)

	useEffect(() => {
		// Pusher.logToConsole = true;

		const pusher = new Pusher('cd903e7b8276fdcb30a5', {
			cluster: 'ap2'
		});

		const channel = pusher.subscribe('chat');
		channel.bind('chat-event', function (data) {
			setChats((prevState) => [
				...prevState,
				{ sender: data.sender, message: data.message },
			])
			console.log("sfsf", data)
		});
		console.log(chats)
		return () => {
			pusher.unsubscribe("chat")
		}
	})

	const handleSubmit = async (e) => {
		e.preventDefault();	
		if(messageField.current.value === '') return;
		await axios.post('/api/pusher', { message: messageField.current.value, username }).then(() => {
			messageField.current.value = ''
		})
	}

	useEffect(() => {
		fetch("/api/profileSetup", {
			body: JSON.stringify({ pfp, name, myEmail, add: false }),
			method: "POST",
		}).then(async (res) => {
			var user = await res.json();
			if (user.success === false) {
				setShowUsernameInput(true);
			}
		});
	}, [session, showUsernameInput, myEmail, name, pfp]);

	useEffect(() => {
		fetch("/api/getUserdata", {
			body: JSON.stringify({ myEmail }),
			method: "POST",
		}).then(async (res) => {
			setUsername(await res.json());
		});
	}, [session, showUsernameInput, myEmail]);

	const links = [
		{ id: "1", text: "Friends", path: "/friends" },
		{
			id: "2",
			text: "Profile",
			//@ts-ignore
			path: `/profile/${username?.user?.username}`,
		},
	];

	log.debug(showUsernameInput);
	return (
		<div>
			<Head>
				<title>Home</title>
				<meta
					name="description"
					content="Generated by create next app"
				/>
				<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css" rel="stylesheet"
                      integrity="sha384-+0n0xVW2eSR5OomGNYDnhzAbDsOXxcvSN1TPprVMTNDbiYZCxYbOOl7+AMvyTG2x"
                      crossOrigin="anonymous"/>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main>
				<Navbar links={links} />
				{log.debug(showUsernameInput)}
				{showUsernameInput && (
					<UsernamePopup activate={showUsernameInput} />
				)}
				<h1 className="text-center text-nord_light-300 font-bold text-xl pt-10">
					Welcome {session?.user.name}
				</h1>
				<div className="list-group list-group-flush border-bottom scrollarea" style={{minHeight: "500px"}}>
					{chats.map((chat, id) => {
						return(
							chat.sender.username === username?.user.username ? (
								<>
									<p dir="rtl">{chat.message}</p>
									<small dir="rtl">{chat.sender.name}</small>
								</>
							) : (
								<>
									<p>{chat.message}</p>
									<small>{chat.sender.name}</small>
								</>
							)
						)
					})}
				</div>

				<form onSubmit={(e) => { handleSubmit(e) }}>
					<input
					 	ref={messageField}
						className="form-control"
						type="text"
						placeholder="Message"
					/>
				</form>
			</main>
		</div>
	);
}
