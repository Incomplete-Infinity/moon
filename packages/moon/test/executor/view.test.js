import Moon from "moon/src/index";

let root = document.createElement("span");
let eventResult;
root.id = "app";
document.body.appendChild(root);

function shuffle(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}

	return arr;
}

function handler1(m) {
	eventResult = m;
	return {};
}

function handler2(m) {
	eventResult = m;
	return {};
}

function ExecutorTest({ list, focus }) {
	return (
		<div>
			<for={item, index} of={list}>
				<if={item % 2 === 0}>
					<p lang="en" class={item} for={item} ariaset={{hidden: false, removeme: true}} dataset={{foo: "bar", removeme: true}} style={{color: "red", background: "blue"}} @click={handler1}>{item} {index}</p>
				</if>
				<else-if={item % 3 === 0}>
					<p lang="en" class={item} for={item} id={item} ariaset={{hidden: false, different: true}} dataset={{foo: "bar", different: true}} style={{color: "red", fontSize: "20px"}} @click={handler2}>{item} {index}</p>
				</else-if>
				<else>
					<p lang="en">{item} {index}</p>
				</else>
			</for>
			<h1>Moon</h1>
			<p @click={handler1} @dblclick={handler2}>Partially static.</p>
			<if={list.length > 0}>
				<if={list[0] % 2 === 0}>
					<input focus/>
				</if>
				<else-if={list[0] % 3 === 0}>
					<input focus={false}/>
				</else-if>
				<else>
					<input/>
				</else>
			</if>
			<input focus={false}/>
		</div>
	);
}

function Root() {
	const list = [];

	return {
		list,
		view: (<ExecutorTest list={list}/>)
	};
}

Moon.use({
	list: Moon.data.driver,
	view: Moon.view.driver(root)
});

Moon.run(Root);

root = document.body.firstChild;

function verify(list) {
	const span = root.firstChild;

	for (let i = 0; i < list.length; i++) {
		const item = list[i];
		const element = span.childNodes[i];

		if (item % 2 === 0) {
			expect(element.tagName).toEqual("P");
			expect(element.lang).toEqual("en");
			expect(element.className).toEqual(item.toString());
			expect(element.htmlFor).toEqual(item);
			expect(element.id).toEqual("");
			expect(element.getAttribute("aria-hidden")).toEqual("false");
			expect(element.getAttribute("aria-removeme")).toEqual("true");
			expect(element.getAttribute("aria-different")).toBeNull();
			expect(element.dataset.foo).toEqual("bar");
			expect(element.dataset.removeme).toEqual("true");
			expect(element.dataset.different).toBeUndefined();
			expect(element.style.color).toEqual("red");
			expect(element.style.background).toEqual("blue");
			expect(element.style.fontSize).toEqual("");
			expect(element.MoonEvent["@click"]).toBeDefined();
			expect(element.textContent).toEqual(`${item}${i}`);

			element.click();

			expect(eventResult.view.constructor).toEqual(MouseEvent);
			expect(eventResult.list).toEqual(list);

			eventResult = undefined;
		} else if (item % 3 === 0) {
			expect(element.tagName).toEqual("P");
			expect(element.lang).toEqual("en");
			expect(element.className).toEqual(item.toString());
			expect(element.htmlFor).toEqual(item);
			expect(element.id).toEqual(item.toString());
			expect(element.getAttribute("aria-hidden")).toEqual("false");
			expect(element.getAttribute("aria-removeme")).toBeNull();
			expect(element.getAttribute("aria-different")).toEqual("true");
			expect(element.dataset.foo).toEqual("bar");
			expect(element.dataset.removeme).toBeUndefined();
			expect(element.dataset.different).toEqual("true");
			expect(element.style.color).toEqual("red");
			expect(element.style.background).toEqual("");
			expect(element.style.fontSize).toEqual("20px");
			expect(element.MoonEvent["@click"]).toBeDefined();
			expect(element.textContent).toEqual(`${item}${i}`);

			element.click();

			expect(eventResult.view.constructor).toEqual(MouseEvent);
			expect(eventResult.list).toEqual(list);

			eventResult = undefined;
		} else {
			expect(element.tagName).toEqual("P");
			expect(element.lang).toEqual("en");
			expect(element.className).toEqual("");
			expect(element.htmlFor === "" || element.htmlFor === undefined).toBeTruthy();
			expect(element.id).toEqual("");
			expect(element.getAttribute("aria-hidden")).toBeNull();
			expect(element.getAttribute("aria-removeme")).toBeNull();
			expect(element.getAttribute("aria-different")).toBeNull();
			expect(element.dataset.foo).toBeUndefined();
			expect(element.dataset.removeme).toBeUndefined();
			expect(element.dataset.different).toBeUndefined();
			expect(element.style.color).toEqual("");
			expect(element.style.background).toEqual("");
			expect(element.style.fontSize).toEqual("");
			expect(element.textContent).toEqual(`${item}${i}`);

			if (element.MoonEvent) {
				expect(element.MoonEvent["@click"]).toBeUndefined();
			} else {
				expect(element.MoonEvent).toBeNull();
			}

			element.click();

			expect(eventResult).toBeUndefined();
		}
	}

	const h1 = span.nextSibling;

	expect(h1.tagName).toEqual("H1");
	expect(h1.textContent).toEqual("Moon");

	const p = h1.nextSibling;

	expect(p.tagName).toEqual("P");
	expect(p.textContent).toEqual("Partially static.");
	expect(p.MoonEvent["@click"]).toEqual(handler1);
	expect(p.MoonEvent["@dblclick"]).toEqual(handler2);

	const input = p.nextSibling;

	if (list.length > 0) {
		const listFirst = list[0];

		expect(input.tagName).toEqual("INPUT");

		if (listFirst % 2 === 0) {
			expect(document.activeElement).toBe(input);
		} else if (listFirst % 3 === 0) {
			expect(document.activeElement).not.toBe(input);
		} else {
			expect(document.activeElement).not.toBe(input);
		}
	} else {
		expect(input.nodeName).toEqual("#text");
		expect(input.textContent).toEqual("");
	}

	const inputBlurred = input.nextSibling;

	expect(inputBlurred.tagName).toEqual("INPUT");
	expect(document.activeElement).not.toBe(inputBlurred);
}

function assertExecute(before, after) {
	Moon.run(() => ({
		list: before,
		view: (<ExecutorTest list={before}/>)
	}));
	verify(before);
	Moon.run(() => ({
		list: after,
		view: (<ExecutorTest list={after}/>)
	}));
	verify(after);
}

// Replace
for (let i of [2, 3, 5]) {
	for (let j of [2, 3, 5]) {
		test(`[${i}] -> [${j}]`, () => {
			assertExecute([i], [j]);
		});
	}
}

// Append
for (let i of [2, 3, 5]) {
	for (let j of [2, 3, 5]) {
		const before = [i];
		const after = [j, j + 1, j + 2, j + 3, j * 2];

		test(`[${before.toString()}] -> [${after.toString()}]`, () => {
			assertExecute(before, after);
		});
	}
}

// Remove
for (let i of [2, 3, 5]) {
	for (let j of [2, 3, 5]) {
		const before = [i, i + 1, i + 2, i + 3, i * 2];
		const after = [j];

		test(`[${before.toString()}] -> [${after.toString()}]`, () => {
			assertExecute(before, after);
		});
	}
}

// Fuzz
for (let i of Array.from({ length: 100 })) {
	const before = shuffle(Array.from({ length: Math.floor(Math.random() * 100) }).map(x => Math.floor(Math.random() * 25)));
	const after = shuffle(Array.from({ length: Math.floor(Math.random() * 100) }).map(x => Math.floor(Math.random() * 25)));

	test(`fuzz [${before.toString()}] -> [${after.toString()}]`, () => {
		assertExecute(before, after);
	});
}