const EmptyState = () => {
	return (
		<div className="mt-10 border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
			<p className="text-sm font-medium text-gray-900 dark:text-white">
				No matching skills found
			</p>
			<p className="mt-1 text-sm text-gray-500">
				Try changing your search terms or selecting another category.
			</p>
		</div>
	);
};

export default EmptyState;
