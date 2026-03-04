export default function ParentDashboardPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Tổng Quan
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Card 1: Hoạt động hôm nay */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                {/* Icon */}
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500">Phiên học hôm nay</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">0 / 3</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Xem chi tiết
                            </a>
                        </div>
                    </div>
                </div>

                {/* Card 2: Thời gian tập trung */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="truncate text-sm font-medium text-gray-500">Thời gian tập trung TB</dt>
                                <dd>
                                    <div className="text-lg font-medium text-gray-900">0 phút</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Xem báo cáo
                            </a>
                        </div>
                    </div>
                </div>

                {/* Card 3: Điểm Quiz */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="truncate text-sm font-medium text-gray-500">Điểm Quiz trung bình</dt>
                                <dd>
                                    <div className="text-lg font-medium text-gray-900">--</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Xem lịch sử
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
