import event from "moon/src/event";

/**
 * Caches for performance
 */
Node.prototype.MoonChildren = null;
Node.prototype.MoonReferenceEvents = null;

/**
 * Reference event manager
 */
function MoonReferenceEvents() {}

MoonReferenceEvents.prototype.handleEvent = function(event) {
	this[event.type]();
};

/**
 * Reference bind keys and events
 */
const referenceProperties = {
	audio: {
		"*currentTime": {
			key: "currentTime",
			event: "timeupdate"
		},
		"*muted": {
			key: "muted",
			event: "volumechange"
		},
		"*paused": {
			key: "paused",
			event: "pause"
		},
		"*playbackRate": {
			key: "playbackRate",
			event: "ratechange"
		},
		"*volume": {
			key: "volume",
			event: "volumechange"
		}
	},
	input: {
		"*checked": {
			key: "checked",
			event: "change"
		},
		"*value": {
			key: "value",
			event: "input"
		}
	},
	video: {
		"*currentTime": {
			key: "currentTime",
			event: "timeupdate"
		},
		"*muted": {
			key: "muted",
			event: "volumechange"
		},
		"*paused": {
			key: "paused",
			event: "pause"
		},
		"*playbackRate": {
			key: "playbackRate",
			event: "ratechange"
		},
		"*volume": {
			key: "volume",
			event: "volumechange"
		}
	}
};

/**
 * View Data Property Defaults
 */
const viewDataDefaults = {};

/**
 * View constructor
 */
export function View(name, data, children, references) {
	this.name = name;
	this.data = data;
	this.children = children;
	this.references = references;
}

/**
 * Create a reference event handler.
 *
 * @param {function} set
 * @param {object} viewNode
 * @param {string} key
 * @returns {function} event handler
 */
function referenceHandler(set, viewNode, key) {
	return event(m => set(m, viewNode[key]));
}

/**
 * Get the default data property value for a key of a view.
 */
function viewDataDefault(viewName, key) {
	return (
		viewName in viewDataDefaults ?
			viewDataDefaults[viewName] :
			(
				viewDataDefaults[viewName] =
					viewName === "text" ?
						document.createTextNode("") :
						document.createElement(viewName)
			)
	)[key];
}

/**
 * Create a view node.
 *
 * @param {object} view
 */
export function viewNodeCreate(view) {
	const viewName = view.name;
	let viewNode;

	if (viewName === "text") {
		viewNode = document.createTextNode(view.data.data);
		viewNode.MoonChildren = [];
	} else {
		viewNode = document.createElement(viewName);
		const viewNodeChildren = viewNode.MoonChildren = [];
		const viewData = view.data;
		const viewChildren = view.children;
		const viewReferences = view.references;

		for (const key in viewData) {
			viewDataCreate(viewNode, viewName, viewReferences, key, viewData[key]);
		}

		for (let i = 0; i < viewChildren.length; i++) {
			viewNodeChildren.push(viewNode.appendChild(viewNodeCreate(viewChildren[i])));
		}
	}

	return viewNode;
}

/**
 * Create a data property.
 *
 * @param {object} viewNode
 * @param {string} viewName
 * @param {object} viewReferences
 * @param {string} key
 * @param {any} value
 */
export function viewDataCreate(viewNode, viewName, viewReferences, key, value) {
	switch (key) {
		case "attributes": {
			for (const keyAttribute in value) {
				viewNode.setAttribute(keyAttribute, value[keyAttribute]);
			}

			break;
		}
		case "style": {
			const viewNodeStyle = viewNode.style;

			for (const keyStyle in value) {
				viewNodeStyle[keyStyle] = value[keyStyle];
			}

			break;
		}
		case "class": {
			viewNode.className = value;

			break;
		}
		case "for": {
			viewNode.htmlFor = value;

			break;
		}
		case "children": break;
		default: {
			const keyFirst = key[0];

			if (keyFirst === "*") {
				const reference = viewReferences[key];
				const referenceProperty = referenceProperties[viewName][key];
				const referenceKey = referenceProperty.key;
				const referenceEvent = referenceProperty.event;
				let viewNodeReferenceEvents = viewNode.MoonReferenceEvents;

				if (viewNodeReferenceEvents === null) {
					viewNodeReferenceEvents = viewNode.MoonReferenceEvents = new MoonReferenceEvents();
				}

				viewNode[referenceKey] = reference.get;
				viewNodeReferenceEvents[referenceEvent] = referenceHandler(reference.set, viewNode, referenceKey);
				viewNode.addEventListener(referenceEvent, viewNodeReferenceEvents);
			} else if (keyFirst === "o" && key[1] === "n") {
				viewNode[key.toLowerCase()] = event(value);
			} else {
				viewNode[key] = value;
			}
		}
	}
}

/**
 * Update a data property.
 *
 * @param {object} viewNode
 * @param {string} viewName
 * @param {object} viewReferences
 * @param {string} key
 * @param {any} valueOld
 * @param {any} valueNew
 */
export function viewDataUpdate(viewNode, viewName, viewReferences, key, valueOld, valueNew) {
	switch (key) {
		case "attributes": {
			for (const keyAttribute in valueNew) {
				const valueAttributeNew = valueNew[keyAttribute];

				if (!(keyAttribute in valueOld) || valueAttributeNew !== valueOld[keyAttribute]) {
					viewNode.setAttribute(keyAttribute, valueAttributeNew);
				}
			}

			for (const keyAttribute in valueOld) {
				if (!(keyAttribute in valueNew)) {
					viewNode.removeAttribute(keyAttribute);
				}
			}

			break;
		}
		case "style": {
			const viewNodeStyle = viewNode.style;

			for (const keyStyle in valueNew) {
				const valueStyleNew = valueNew[keyStyle];

				if (!(keyStyle in valueOld) || valueStyleNew !== valueOld[keyStyle]) {
					viewNodeStyle[keyStyle] = valueStyleNew;
				}
			}

			for (const keyStyle in valueOld) {
				if (!(keyStyle in valueNew)) {
					viewNodeStyle[keyStyle] = "";
				}
			}

			break;
		}
		case "class": {
			viewNode.className = valueNew;

			break;
		}
		case "for": {
			viewNode.htmlFor = valueNew;

			break;
		}
		case "children": break;
		default: {
			const keyFirst = key[0];

			if (keyFirst === "*") {
				const reference = viewReferences[key];
				const referenceProperty = referenceProperties[viewName][key];
				const referenceKey = referenceProperty.key;
				viewNode[referenceKey] = reference.get;

				if (valueOld.value !== valueNew.value) {
					viewNode.MoonReferenceEvents[referenceProperty.event] = referenceHandler(reference.set, viewNode, referenceKey);
				}
			} else if (keyFirst === "o" && key[1] === "n") {
				viewNode[key.toLowerCase()] = event(valueNew);
			} else {
				viewNode[key] = valueNew;
			}
		}
	}
}

/**
 * Remove a data property.
 *
 * @param {object} viewNode
 * @param {string} viewName
 * @param {object} viewData
 * @param {string} key
 */
export function viewDataRemove(viewNode, viewName, viewData, key) {
	switch (key) {
		case "attributes": {
			for (const keyAttribute in viewData.attributes) {
				viewNode.removeAttribute(keyAttribute);
			}

			break;
		}
		case "class": {
			viewNode.className = "";

			break;
		}
		case "for": {
			viewNode.htmlFor = "";

			break;
		}
		case "children": break;
		default: {
			const keyFirst = key[0];

			if (keyFirst === "*") {
				const referenceProperty = referenceProperties[viewName][key];
				const referenceKey = referenceProperty.key;
				const referenceEvent = referenceProperty.event;
				const viewNodeReferenceEvents = viewNode.MoonReferenceEvents;

				viewNode[referenceKey] = viewDataDefault(viewName, referenceKey);
				viewNodeReferenceEvents[referenceEvent] = null;
				viewNode.removeEventListener(referenceEvent, viewNodeReferenceEvents);
			} else if (keyFirst === "o" && key[1] === "n") {
				viewNode[key.toLowerCase()] = null;
			} else {
				viewNode[key] = viewDataDefault(viewName, key);
			}
		}
	}
}

/**
 * Patch a view node into a new view, using an old view as a reference.
 *
 * @param {object} viewNode
 * @param {object} viewOld
 * @param {object} viewNew
 * @param {number} index
 */
export function viewPatch(viewNode, viewOld, viewNew, index) {
	if (viewOld !== viewNew) {
		const viewNewName = viewNew.name;

		if (viewOld.name !== viewNewName) {
			const viewNodeParent = viewNode.parentNode;

			viewNodeParent.replaceChild(viewNodeParent.MoonChildren[index] = viewNodeCreate(viewNew), viewNode);
		} else {
			const viewOldData = viewOld.data;
			const viewOldChildren = viewOld.children;
			const viewNewData = viewNew.data;
			const viewNewChildren = viewNew.children;

			if (viewOldData !== viewNewData) {
				const viewNewReferences = viewNew.references;

				for (const key in viewNewData) {
					if (key in viewOldData) {
						const valueOld = viewOldData[key];
						const valueNew = viewNewData[key];

						if (valueOld !== valueNew) {
							viewDataUpdate(viewNode, viewNewName, viewNewReferences, key, valueOld, valueNew);
						}
					} else {
						viewDataCreate(viewNode, viewNewName, viewNewReferences, key, viewNewData[key]);
					}
				}

				for (const key in viewOldData) {
					if (!(key in viewNewData)) {
						viewDataRemove(viewNode, viewNewName, viewOldData, key);
					}
				}
			}

			if (viewOldChildren !== viewNewChildren) {
				const viewNodeChildren = viewNode.MoonChildren;
				const viewOldChildrenLength = viewOldChildren.length;
				const viewNewChildrenLength = viewNewChildren.length;
				let i = 0;

				if (viewOldChildrenLength === viewNewChildrenLength) {
					for (; i < viewOldChildrenLength; i++) {
						viewPatch(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i], i);
					}
				} else if (viewOldChildrenLength < viewNewChildrenLength) {
					for (; i < viewOldChildrenLength; i++) {
						viewPatch(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i], i);
					}

					for (; i < viewNewChildrenLength; i++) {
						viewNodeChildren.push(viewNode.appendChild(viewNodeCreate(viewNewChildren[i])));
					}
				} else {
					for (; i < viewNewChildrenLength; i++) {
						viewPatch(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i], i);
					}

					for (; i < viewOldChildrenLength; i++) {
						viewNode.removeChild(viewNodeChildren.pop());
					}
				}
			}
		}
	}
}
